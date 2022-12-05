// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/solidity-contracts-nft/contracts/warper/ERC721/presets/ERC721PresetConfigurable.sol";

import "./interfaces/IERC20RewardDistributor.sol";
import "./interfaces/IRentingHookMechanics.sol";
import "./interfaces/IContractRegistry.sol";
import "./IERC20RewardWarper.sol";
import "./auth/Auth.sol";

/**
 * @title Custom Warper for ERC20 Tournament rewarding.
 */
contract ERC20RewardWarper is IERC20RewardWarper, IRentingHookMechanics, ERC721PresetConfigurable, Auth {
    using IQProtocolStructsMock for IQProtocolStructsMock.RentalEarnings;
    using IQProtocolStructsMock for IQProtocolStructsMock.Agreement;

    /**
     * @dev ERC20RewardDistributor contact key.
     */
    bytes4 private constant ERC20_REWARD_DISTRIBUTOR = bytes4(keccak256("ERC20RewardDistributor"));

    /**
     * @dev ContractRegistry address.
     */
    address internal _contractRegistryMock;

    /**
     * @dev serviceId => tournamentId => player => tokenId => TournamentParticipant.
     */
    mapping(uint64 => mapping(uint64 => mapping(address => mapping(uint256 => TournamentParticipant))))
        internal _tournamentParticipants;

    /**
     * @dev tokenId => rentalId.
     */
    mapping(address => mapping (uint256 => uint256)) internal _renterTokenIdsToRentals;

    /**
     * @dev rentalId => listingId.
     */
    mapping(uint256 => uint256) internal _rentalIdsToListings;

    /**
     * @dev Constructor for the IQNFTWarper contract.
     */
    constructor(bytes memory config) Auth() warperInitializer {
        super.__initialize(config);
    }

    /**
     * @inheritdoc IERC20RewardWarper
     */
    function distributeRewards(
        uint64 serviceId,
        uint64 tournamentId,
        uint256 tokenId,
        uint256 rewardAmount,
        address participant,
        address rewardTokenAddress
    ) external onlyAuthorizedCaller {
        // Retrieve participant record
        TournamentParticipant memory tournamentParticipant = _tournamentParticipants[serviceId][tournamentId][
            participant
        ][tokenId];

        // Check that participant exists
        if (tournamentParticipant.listingId == 0 && tournamentParticipant.rentalId == 0) {
            revert ParticipantDoesNotExist();
        }

        // Get address of ERC20RewardDistributor from Contract Registry
        address rewardDistributor = IContractRegistry(_contractRegistryMock).getContract(ERC20_REWARD_DISTRIBUTOR);

        // Init distribution through ERC20RewardDistributor
        IQProtocolStructsMock.RentalEarnings memory rentalRewardFees = IERC20RewardDistributor(rewardDistributor)
            .distributeExternalReward(
                tournamentParticipant.listingId,
                tournamentParticipant.rentalId,
                rewardTokenAddress,
                rewardAmount
            );

        // Emit event
        // TODO review output for TRV needs.
        emit RewardsDistributed(
            serviceId,
            tournamentId,
            tokenId,
            rewardAmount,
            tournamentParticipant.rentalId,
            tournamentParticipant.listingId,
            participant,
            rewardTokenAddress,
            rentalRewardFees
        );
    }

    /**
     * @inheritdoc IERC20RewardWarper
     */
    function onJoinTournament(
        uint64 serviceId,
        uint64 tournamentId,
        address participant,
        uint256 tokenId
    ) external onlyAuthorizedCaller {
        // Make sure that the rental is active!
        if (ownerOf(tokenId) != participant) revert ParticipantIsNotOwnerOfToken();

        // Associate the rentalId with the participant in the tournament.
        // We don't need to worry about the `_tokenIdsToRentals` being outdated
        // because that's already implicitly checked via the ownerOf() call above.
        uint256 rentalId = _renterTokenIdsToRentals[participant][tokenId];

        // Retrieve listingId associated with the rentalId
        uint256 listingId = _rentalIdsToListings[rentalId];

        // Registering new tournament participant
        _tournamentParticipants[serviceId][tournamentId][participant][tokenId] = TournamentParticipant({
            rentalId: rentalId,
            listingId: listingId
        });

        // Emit event
        emit JoinedTournament(serviceId, tournamentId, participant, tokenId, rentalId);
    }

    /**
     * @inheritdoc IRentingHookMechanics
     */
    function __onRent(
        uint256 rentalId,
        IQProtocolStructsMock.Agreement calldata rentalAgreement,
        IQProtocolStructsMock.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyMetahub returns (bool, string memory) {
        for (uint256 i = 0; i < rentalAgreement.warpedAssets.length; i++) {
            (, uint256 tokenId) = _decodeAssetId(rentalAgreement.warpedAssets[i].id);
            _renterTokenIdsToRentals[rentalAgreement.renter][tokenId] = rentalId;
        }

        _rentalIdsToListings[rentalId] = rentalAgreement.listingId;
        // Inform Metahub that everything is fine
        return (true, "");
    }

    /**
     * @dev Retuns rental ID by token ID.
     * @notice may be removed in future
     * @param tokenId Token ID.
     * @return Rental ID.
     */
    function getTokenRental(address renter, uint256 tokenId) external view returns(uint256) {
        return _renterTokenIdsToRentals[renter][tokenId];
    }

    /**
     * @dev Retuns listing ID by rental ID.
     * @notice may be removed in future
     * @param rentalId rental ID.
     * @return Listing ID.
     */
    function getRentalListing(uint256 rentalId) external view returns(uint256) {
        return _rentalIdsToListings[rentalId];
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IERC20RewardWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @notice TO REMOVE in future, was added because missing this method in current Warper implementation
     * @dev Decodes asset ID and extracts identification data.
     * @param id Asset ID structure.
     * @return token Token contract address.
     * @return tokenId Token ID.
     */
    function _decodeAssetId(Assets.AssetId memory id) internal pure returns (address token, uint256 tokenId) {
        return abi.decode(id.data, (address, uint256));
    }
}
