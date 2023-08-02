// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/contract-registry/Contracts.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/renting-manager/IRentingManager.sol";

import "./IERC20RewardWarperForTRV.sol";
import "../auth/Auth.sol";

/**
 * @title Custom Warper for ERC20 Tournament rewarding.
 */
contract ERC20RewardWarperForTRV is IERC20RewardWarperForTRV, IRentingHookMechanics, ERC721ConfigurablePreset, Auth {
    /**
     * @dev ListingManager contact key.
     */
    bytes4 private immutable LISTING_MANAGER;

    /**
     * @dev RentingManager contact key.
     */
    bytes4 private immutable RENTING_MANAGER;

    /**
     * @dev serviceId => tournamentId => player => tokenId => rentalId.
     */
    mapping(uint64 => mapping(uint64 => mapping(address => mapping(uint256 => uint256))))
        internal _tournamentAssociatedRental;

    /**
     * @dev tokenId => rentalId.
     */
    mapping(address => mapping(uint256 => uint256)) internal _lastActiveRental;

    /// @dev Address where the rewards get taken from.
    address internal _rewardPool;

    /**
     * @dev Constructor for the IQNFTWarper contract.
     */
    constructor(bytes memory config) Auth() warperInitializer {
        super.__initialize(config);

        (, , address rewardPool) = abi.decode(config, (address, address, address));
        setRewardPool(rewardPool);

        LISTING_MANAGER = Contracts.LISTING_MANAGER;
        RENTING_MANAGER = Contracts.RENTING_MANAGER;
    }

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
        uint256 tournamentAssociatedRentalId = _tournamentAssociatedRental[serviceId][tournamentId][participant][
            tokenId
        ];

        // Check that participant exists!
        if (tournamentAssociatedRentalId == 0) {
            revert ParticipantDoesNotExist();
        }

        IListingManager listingManager = IListingManager(IContractRegistry(_metahub()).getContract(LISTING_MANAGER));
        IRentingManager rentingManager = IRentingManager(IContractRegistry(_metahub()).getContract(RENTING_MANAGER));

        Rentings.Agreement memory agreement = rentingManager.rentalAgreementInfo(tournamentAssociatedRentalId);
        Listings.Listing memory listing = listingManager.listingInfo(agreement.listingId);

        ERC20RewardDistributionHelper.RentalExternalERC20RewardFees
            memory rentalExternalERC20RewardFees = ERC20RewardDistributionHelper.getRentalExternalERC20RewardFees(
                agreement,
                rewardTokenAddress,
                rewardAmount
            );

        IERC20(rewardTokenAddress).transferFrom(
            _rewardPool,
            listing.beneficiary,
            rentalExternalERC20RewardFees.listerRewardFee
        );
        IERC20(rewardTokenAddress).transferFrom(
            _rewardPool,
            agreement.renter,
            rentalExternalERC20RewardFees.renterRewardFee
        );
        address protocolExternalFeesCollector = IMetahub(_metahub()).protocolExternalFeesCollector();
        if (protocolExternalFeesCollector != address(0)) {
            IERC20(rewardTokenAddress).transferFrom(
                _rewardPool,
                protocolExternalFeesCollector,
                rentalExternalERC20RewardFees.protocolRewardFee
            );
        }

        // Emit event
        emit RewardsDistributed(
            serviceId,
            tournamentId,
            tokenId,
            tournamentAssociatedRentalId,
            agreement.renter,
            listing.beneficiary
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

        // Associate the latest active (for given participant and tokenId) rental with the tournament.
        // We don't need to worry about the rental being inactive,
        // because that's already implicitly checked via the ownerOf() call above.
        uint256 rentalId = _lastActiveRental[participant][tokenId];

        // Registering new tournament participant's currently active rentalId.
        _tournamentAssociatedRental[serviceId][tournamentId][participant][tokenId] = rentalId;
    }

    /**
     * @inheritdoc IRentingHookMechanics
     */
    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyRentingManager returns (bool, string memory) {
        // (, uint256 tokenId) = _tokenWithId(rentalAgreement.warpedAssets[0]);

        for (uint256 i = 0; i < rentalAgreement.warpedAssets.length; i++) {
            (, uint256 tokenId) = _decodeAssetId(rentalAgreement.warpedAssets[i].id);
            // Latest active rental is persisted.
            _lastActiveRental[rentalAgreement.renter][tokenId] = rentalId;
        }

        // Inform Renting Manager that everything is fine
        return (true, "");
    }

    /// @inheritdoc IERC20RewardWarperForTRV
    function setRewardPool(address rewardPool) public onlyOwner {
        _rewardPool = rewardPool;
    }

    /**
     * @dev Returns last active rentalId for `renter` and `tokenId`.
     * @notice may be removed in future
     * @param renter Renter.
     * @param tokenId Token ID.
     * @return Rental ID.
     */
    function getLastActiveRentalId(address renter, uint256 tokenId) external view returns (uint256) {
        return _lastActiveRental[renter][tokenId];
    }

    function getTournamentAssociatedRentalId(
        uint64 serviceId,
        uint64 tournamentId,
        address participant,
        uint256 tokenId
    ) external view returns (uint256) {
        return _tournamentAssociatedRental[serviceId][tournamentId][participant][tokenId];
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
