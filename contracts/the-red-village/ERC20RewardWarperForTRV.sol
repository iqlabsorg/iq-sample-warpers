// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/solidity-contracts-nft/contracts/warper/ERC721/v1/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/warper/mechanics/v1/renting-hook/IRentingHookMechanics.sol";

import "./IERC20RewardWarperForTRV.sol";
import "../auth/Auth.sol";

/**
 * @title Custom Warper for ERC20 Tournament rewarding.
 */
contract ERC20RewardWarperForTRV is IERC20RewardWarperForTRV, IRentingHookMechanics, ERC721ConfigurablePreset, Auth {
    /**
     * @dev ERC20RewardDistributor contact key.
     */
    bytes4 private constant ERC20_REWARD_DISTRIBUTOR = bytes4(keccak256("ERC20RewardDistributor"));

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

    /// @dev Address where the rewards get taken from.
    address internal _rewardPool;

    /**
     * @inheritdoc IERC20RewardWarperForTRV
     */
    function disperseRewards(
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
        address rewardDistributor = IContractRegistry(_metahub()).getContract(ERC20_REWARD_DISTRIBUTOR);

        IERC20(rewardTokenAddress).transferFrom(_rewardPool, rewardDistributor, rewardAmount);

        // Init distribution through ERC20RewardDistributor
        Accounts.RentalEarnings memory rentalRewardFees = IERC20RewardDistributor(rewardDistributor)
            .distributeExternalReward(
                tournamentParticipant.listingId,
                tournamentParticipant.rentalId,
                rewardTokenAddress,
                rewardAmount
            );

        // Emit event
        emit RewardsDistributed(
            serviceId,
            tournamentId,
            tokenId,
            tournamentParticipant.rentalId,
            participant,
            address(0)
        );
    }

    /**
     * @inheritdoc IERC20RewardWarperForTRV
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
    }

    /**
     * @inheritdoc IRentingHookMechanics
     */
    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyRentingManager returns (bool, string memory) {
        for (uint256 i = 0; i < rentalAgreement.warpedAssets.length; i++) {
            (, uint256 tokenId) = _decodeAssetId(rentalAgreement.warpedAssets[i].id);
            _renterTokenIdsToRentals[rentalAgreement.renter][tokenId] = rentalId;
        }

        _rentalIdsToListings[rentalId] = rentalAgreement.listingId;
        // Inform Renting Manager that everything is fine
        return (true, "");
    }

    /// @inheritdoc IERC20RewardWarperForTRV
    function setRewardPool(address rewardPool) external onlyOwner {
        _rewardPool = rewardPool;
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
    function getRentalListing(uint256 rentalId) external view returns (uint256) {
        return _rentalIdsToListings[rentalId];
    }

    function getTournamentParticipant(
        uint64 serviceId,
        uint64 tournamentId,
        address participant,
        uint256 tokenId
    ) external view returns (TournamentParticipant memory) {
        return _tournamentParticipants[serviceId][tournamentId][participant][tokenId];
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IERC20RewardWarperForTRV).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
