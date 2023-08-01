// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/contract-registry/Contracts.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/renting-manager/IRentingManager.sol";
import "@iqprotocol/iq-space-protocol/contracts/listing/listing-terms-registry/IListingTermsRegistry.sol";
import "@iqprotocol/iq-space-protocol/contracts/tax/tax-terms-registry/ITaxTermsRegistry.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./IUniversusWarper.sol";
import "../auth/Auth.sol";

/**
 * @title Custom Warper for Universus
 */
contract UniversusWarper is
    IUniversusWarper,
    IRentingHookMechanics,
    IAssetRentabilityMechanics,
    ERC721ConfigurablePreset,
    Auth
{
    /**
     * @notice This error is thrown when the lengths of the collectionAddresses and requiredHoldings arrays do not match.
     * @dev The lengths of these arrays should always be equal, as each address in collectionAddresses should correspond to a required holding amount in requiredHoldings.
     */
    error ArrayLengthMismatch(string description);

    /**
     * @dev ListingManager contact key.
     */
    bytes4 private immutable LISTING_MANAGER;

    /**
     * @dev Reward address for this universe.
     */
    address private _universeRewardAddress;

    /**
     * @dev An array storing the addresses of NFTs a user must own from each collection to be eligible for renting.
     * Each address corresponds to a different NFT collection.
     * The ownership status of NFTs from these collections will be checked for each user.
     */
    address[] private _requiredCollectionAddresses;

    /**
     * @dev An array storing the minimum number of NFTs a user must own from each collection to be eligible for renting.
     * Each element in this array corresponds to the minimum holding required for the respective NFT collection in 'collectionAddresses'.
     */
    uint256[] private _requiredMinimumCollectionAmountThresholds;

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

        (
            ,
            ,
            address universeRewardAddress,
            address[] memory requiredCollectionAddresses,
            uint256[] memory requiredMinimumCollectionAmountThresholds
        ) = abi.decode(config, (address, address, address, address[], uint256[]));

        _universeRewardAddress = universeRewardAddress;
        _requiredCollectionAddresses = requiredCollectionAddresses;
        _requiredMinimumCollectionAmountThresholds = requiredMinimumCollectionAmountThresholds;

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
     * @inheritdoc IAssetRentabilityMechanics
     */
    function __isRentableAsset(
        address renter,
        uint256,
        uint256
    ) external view override returns (bool isRentable, string memory errorMessage) {
        for (uint256 i = 0; i < _requiredCollectionAddresses.length; i++) {
            if (
                IERC721(_requiredCollectionAddresses[i]).balanceOf(renter) <
                _requiredMinimumCollectionAmountThresholds[i]
            ) {
                return (false, "Renter has not enough NFTs from required collections");
            }
        }

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
