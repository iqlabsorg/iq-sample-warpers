// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/contract-registry/Contracts.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/renting-manager/IRentingManager.sol";
import "@iqprotocol/iq-space-protocol/contracts/listing/listing-terms-registry/IListingTermsRegistry.sol";
import "@iqprotocol/iq-space-protocol/contracts/tax/tax-terms-registry/ITaxTermsRegistry.sol";

import "./IUniversusWarper.sol";
import "../auth/Auth.sol";

/**
 * @title Custom Warper for Universus
 */
contract UniversusWarper is IUniversusWarper, IRentingHookMechanics, ERC721ConfigurablePreset, Auth {
    /**
     * @dev ListingManager contact key.
     */
    bytes4 private immutable LISTING_MANAGER;

    /**
     * @dev Reward address for this universe.
     */
    address private _universeRewardAddress;

    /**
     * @dev RentingManager contact key.
     */
    bytes4 private immutable RENTING_MANAGER;

    /**
     * @dev renter address => tokenId => rentalId.
     */
    mapping(address => mapping(uint256 => uint256)) internal _lastActiveRental;

    /**
     * @dev rentalId => rentalDetails.
     */
    mapping(uint256 => RentalDetails) internal _rentalDetails;

    /**
     * @dev Constructor for the IQNFTWarper contract.
     */
    constructor(bytes memory config) Auth() warperInitializer {
        super.__initialize(config);

        (, , address universeRewardAddress) = abi.decode(config, (address, address, address));

        _universeRewardAddress = universeRewardAddress;

        LISTING_MANAGER = Contracts.LISTING_MANAGER;
        RENTING_MANAGER = Contracts.RENTING_MANAGER;
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
            // Latest active rental is persisted.
            _lastActiveRental[rentalAgreement.renter][tokenId] = rentalId;

            RentalDetails storage rentalDetails = _rentalDetails[rentalId];
            rentalDetails.listingTerms = rentalAgreement.agreementTerms.listingTerms;
            rentalDetails.universeTaxTerms = rentalAgreement.agreementTerms.universeTaxTerms;
            rentalDetails.protocolTaxTerms = rentalAgreement.agreementTerms.protocolTaxTerms;
            rentalDetails.rentalId = rentalId;
            rentalDetails.listingId = rentalAgreement.listingId;

            IListingManager listingManager = IListingManager(
                IContractRegistry(_metahub()).getContract(LISTING_MANAGER)
            );

            rentalDetails.lister = listingManager.listingInfo(rentalAgreement.listingId).beneficiary;
            rentalDetails.protocol = IMetahub(_metahub()).protocolExternalFeesCollector();

            // Emit the OnRentHookEvent for every rent
            emit OnRentHookEvent(rentalAgreement.renter, tokenId, rentalId);
        }

        // Inform Renting Manager that everything is fine
        return (true, "");
    }

    /**
     * @dev Returns the last active rental ID for renter and token ID.
     * @param renter Renter address.
     * @param tokenId Token ID.
     * @return The last active rental ID.
     */
    function getLastActiveRentalId(address renter, uint256 tokenId) external view returns (uint256) {
        return _lastActiveRental[renter][tokenId];
    }

    /**
     * @dev Returns RentalDetails for 'rentalId'.
     * @param rentalId Rent ID.
     * @return RentalDetails.
     */
    function getRentalDetails(uint256 rentalId) public view returns (IUniversusWarper.RentalDetails memory) {
        return _rentalDetails[rentalId];
    }

    /**
     * @dev Returns reward address for this universe.
     * @return _universeRewardAddress.
     */
    function getUniverseRewardAddress() public view returns (address) {
        return _universeRewardAddress;
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IUniversusWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
