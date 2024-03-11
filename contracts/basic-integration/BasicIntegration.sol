// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/contract-registry/Contracts.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/renting-manager/IRentingManager.sol";
import "@iqprotocol/iq-space-protocol/contracts/listing/listing-terms-registry/IListingTermsRegistry.sol";
import "@iqprotocol/iq-space-protocol/contracts/tax/tax-terms-registry/ITaxTermsRegistry.sol";

import "./IBasicIntegration.sol";
import "../auth/Auth.sol";

/**
 * @title Basic integration with external reward distribution
 */
contract BasicIntegration is IBasicIntegration, IRentingHookMechanics, ERC721ConfigurablePreset, Auth {
    /**
     * @dev ListingManager contract key.
     */
    bytes4 public immutable LISTING_MANAGER;

    /**
     * @dev RentingManager contract key.
     */
    bytes4 public immutable RENTING_MANAGER;

    /**
     * @dev renter address => tokenId => rentalId.
     */
    mapping(address => mapping(uint256 => uint256)) internal _lastActiveRental;

    /**
     * @dev tokenId => rentalEndTime.
     */
    mapping(uint256 => uint256) internal _tokenRentalEndTime;

    /**
     * @dev rentalId => rentalDetails.
     */
    mapping(uint256 => RentalDetails) internal _rentalDetails;

    /**
     * @dev Constructor for the BasicIntegration contract.
     */
    constructor(bytes memory config) Auth() warperInitializer {
        super.__initialize(config);

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
    ) external virtual override onlyRentingManager returns (bool, string memory) {
        for (uint256 i = 0; i < rentalAgreement.warpedAssets.length; i++) {
            (, uint256 tokenId) = _decodeAssetId(rentalAgreement.warpedAssets[i].id);
            // Latest active rental is persisted.
            _lastActiveRental[rentalAgreement.renter][tokenId] = rentalId;

            _tokenRentalEndTime[tokenId] = rentalAgreement.endTime;

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

        // Notify the Renting Manager of successful operation
        return (true, "");
    }

    /**
     * @inheritdoc IBasicIntegration
     */
    function isRented(uint256 tokenId) public view override returns (bool) {
        if (_tokenRentalEndTime[tokenId] > 0) {
            return block.timestamp <= _tokenRentalEndTime[tokenId];
        }
        return false;
    }

    /**
     * @inheritdoc IBasicIntegration
     */
    function getRentalDuration(uint256 tokenId) public view override returns (uint256) {
        if (block.timestamp <= _tokenRentalEndTime[tokenId]) {
            return _tokenRentalEndTime[tokenId] - block.timestamp;
        }
        return 0;
    }

    /**
     * @inheritdoc IBasicIntegration
     */
    function getLastActiveRentalId(address renter, uint256 tokenId) public view override returns (uint256) {
        return _lastActiveRental[renter][tokenId];
    }

    /**
     * @inheritdoc IBasicIntegration
     */
    function getRentalDetails(uint256 rentalId)
        public
        view
        override
        returns (IBasicIntegration.RentalDetails memory)
    {
        return _rentalDetails[rentalId];
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IBasicIntegration).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
