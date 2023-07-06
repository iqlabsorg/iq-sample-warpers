// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/contract-registry/Contracts.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/renting-manager/IRentingManager.sol";

import "./IERC1155RewardWarperForUniversus.sol";
import "../auth/Auth.sol";

/**
 * @title Custom Warper for ERC1155 Universus rewarding.
 */
contract ERC1155RewardWarperForUniversus is IERC1155RewardWarperForUniversus, IRentingHookMechanics, ERC721ConfigurablePreset, Auth {
    /**
     * @dev ListingManager contact key.
     */
    bytes4 private immutable LISTING_MANAGER;

    /**
     * @dev RentingManager contact key.
     */
    bytes4 private immutable RENTING_MANAGER;

    /**
     * @dev serviceId => universusId => player => tokenId => rentalId.
     */
    mapping(uint64 => mapping(uint64 => mapping(address => mapping(uint256 => uint256))))
        internal _universusAssociatedRental;

    /**
     * @dev tokenId => rentalId.
     */
    mapping(address => mapping (uint256 => uint256)) internal _lastActiveRental;

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
     * @inheritdoc IERC1155RewardWarperForUniversus
     */
    function disperseRewards(
        uint64 serviceId,
        uint64 universusId,
        uint256 tokenId,
        uint256 rewardAmount,
        address participant,
        address rewardTokenAddress
    ) external onlyAuthorizedCaller {
        uint256 universusAssociatedRentalId = _universusAssociatedRental[serviceId][universusId][
            participant
        ][tokenId];

        // Check that participant exists!
        if (universusAssociatedRentalId == 0) {
            revert ParticipantDoesNotExist();
        }

        IListingManager listingManager = IListingManager(
            IContractRegistry(_metahub()).getContract(LISTING_MANAGER)
        );
        IRentingManager rentingManager = IRentingManager(
            IContractRegistry(_metahub()).getContract(RENTING_MANAGER)
        );

        Rentings.Agreement memory agreement = rentingManager.rentalAgreementInfo(universusAssociatedRentalId);
        Listings.Listing memory listing = listingManager.listingInfo(agreement.listingId);

        ERC1155RewardDistributionHelper.RentalExternalERC1155RewardFees
            memory rentalExternalERC1155RewardFees = ERC1155RewardDistributionHelper.getRentalExternalERC1155RewardFees(
                agreement,
                rewardTokenAddress,
                rewardAmount
            );

        IERC1155(rewardTokenAddress).safeTransferFrom(
            _rewardPool,
            listing.beneficiary,
            tokenId,
            rentalExternalERC1155RewardFees.listerRewardFee,
            ""
        );
        IERC1155(rewardTokenAddress).safeTransferFrom(
            _rewardPool,
            agreement.renter,
            tokenId,
            rentalExternalERC1155RewardFees.renterRewardFee,
            ""
        );
        address protocolExternalFeesCollector = IMetahub(_metahub()).protocolExternalFeesCollector();
        if (protocolExternalFeesCollector != address(0)) {
            IERC1155(rewardTokenAddress).safeTransferFrom(
                _rewardPool,
                protocolExternalFeesCollector,
                tokenId,
                rentalExternalERC1155RewardFees.protocolRewardFee,
                ""
            );
        }

        // Emit event
        emit RewardsDistributed(
            serviceId,
            universusId,
            tokenId,
            universusAssociatedRentalId,
            agreement.renter,
            listing.beneficiary
        );
    }

    /**
     * @inheritdoc IRentingHookMechanics
     */
    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyRentingManager returns (bool, string memory) {
        (, uint256 tokenId) = _tokenWithId(rentalAgreement.warpedAssets[0]);

        for (uint256 i = 0; i < rentalAgreement.warpedAssets.length; i++) {
            (, uint256 tokenId) = _decodeAssetId(rentalAgreement.warpedAssets[i].id);
            // Latest active rental is persisted.
            _lastActiveRental[rentalAgreement.renter][tokenId] = rentalId;
        }

        // Inform Renting Manager that everything is fine
        return (true, "");
    }

    /// @inheritdoc IERC1155RewardWarperForUniversus
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
    function getLastActiveRentalId(address renter, uint256 tokenId) external view returns(uint256) {
        return _lastActiveRental[renter][tokenId];
    }

    function getUniversusAssociatedRentalId(
        uint64 serviceId,
        uint64 universusId,
        address participant,
        uint256 tokenId
    ) external view returns (uint256) {
        return _universusAssociatedRental[serviceId][universusId][participant][tokenId];
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IERC1155RewardWarperForUniversus).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
