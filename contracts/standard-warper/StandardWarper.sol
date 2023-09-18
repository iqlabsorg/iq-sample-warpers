// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/contract-registry/Contracts.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/renting-manager/IRentingManager.sol";
import "@iqprotocol/iq-space-protocol/contracts/listing/listing-terms-registry/IListingTermsRegistry.sol";
import "@iqprotocol/iq-space-protocol/contracts/tax/tax-terms-registry/ITaxTermsRegistry.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

import "../zero-balance/ZeroBalanceWarper.sol";
import "./IStandardWarper.sol";

/**
 * @title Custom Warper for universes with external reward distribution
 */
contract StandardWarper is ZeroBalanceWarper, IStandardWarper {
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    /**
     * @dev Defines whether the renter can rent the same asset multiple times.
     */
    bool internal immutable _allowMultipleRentals;

    /**
     * @dev Defines whether the renter can rent more than 1 asset at the same time.
     */
    bool internal immutable _allowConcurrentRentals;

    /**
     * @dev Stores current rental end timestamp for each renter.
     * @notice renter => uint256 (renter's current asset rental end timestamp).
     */
    mapping (address => uint32) internal _currentRentalEndTimestamp;

    /**
     * @dev Stores if renter has rented this asset before.
     * @notice renter => tokenId => bool (renter has rented this asset before).
     */
    mapping (address => mapping (uint256 => uint256)) internal _rentalsCount;

    /**
     * @dev Stores total rental duration for each renter.
     */
    EnumerableMap.AddressToUintMap internal _rentersTotalRentalDuration;

    /**
     * @dev Constructor for the ExternalRewardWarper contract.
     */
    constructor(bytes memory config) ZeroBalanceWarper(config) {
        (, , , , bool allowMultipleRentals, bool allowConcurrentRentals) = abi.decode(config, (address, address, address, address[], bool, bool));

        _allowMultipleRentals = allowMultipleRentals;
        _allowConcurrentRentals = allowConcurrentRentals;
    }

    /**
     * @inheritdoc IRentingHookMechanics
     */
    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyRentingManager returns (bool, string memory) {
        address renter = rentalAgreement.renter;
        _currentRentalEndTimestamp[renter] = rentalAgreement.endTime;

        (, uint256 rentalDurationSoFar) = _rentersTotalRentalDuration.tryGet(renter);

        _rentersTotalRentalDuration.set(
            renter,
            uint256(rentalAgreement.endTime - rentalAgreement.startTime) + rentalDurationSoFar
        );

        for (uint256 i = 0; i < rentalAgreement.warpedAssets.length; i++) {
            (, uint256 tokenId) = _decodeAssetId(rentalAgreement.warpedAssets[i].id);
            // Latest active rental is persisted.
            _rentalsCount[renter][tokenId] += 1;
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

        // Notify the Renting Manager of successful operation
        return (true, "");
    }

    /**
     * @inheritdoc IAssetRentabilityMechanics
     * @notice Asset is rentable if the renter holds NFTs from collections in the _zeroBalanceCheckAddresses array.
     */
    function __isRentableAsset(
        address renter,
        uint256 tokenId,
        uint256
    ) external view virtual override returns (bool isRentable, string memory errorMessage) {
        if (!_allowMultipleRentals && _rentalsCount[renter][tokenId] > 1) {
            return (false, "Renter has already rented this asset");
        }

        if (!_allowConcurrentRentals && _currentRentalEndTimestamp[renter] > uint32(block.timestamp)) {
            return (false, "Concurrent rentals are not allowed");
        }

        for (uint256 i = 0; i < _zeroBalanceCheckAddresses.length; i++) {
            if (IERC721(_zeroBalanceCheckAddresses[i]).balanceOf(renter) > 0) {
                return (false, "Renter holds NFTs from restricted collections");
            }
        }

        return (true, "");
    }

    /**
     * @inheritdoc IStandardWarper
     */
    function allowsMultipleRentals() external view override returns (bool) {
        return _allowMultipleRentals;
    }

    /**
     * @inheritdoc IStandardWarper
     */
    function allowsConcurrentRentals() external view override returns (bool) {
        return _allowConcurrentRentals;
    }

    /**
     * @inheritdoc IStandardWarper
     */
    function getRenterRentalsCount(address renter, uint256 tokenId) external view override returns (uint256) {
        return _rentalsCount[renter][tokenId];
    }

    /**
     * @inheritdoc IStandardWarper
     */
    function getTotalRentalDurations(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory renterAddresses, uint256[] memory totalRentalDurations)
    {
        uint256 indexSize = _rentersTotalRentalDuration.length();
        if (offset >= indexSize) return (new address[](0), new uint256[](0));

        if (limit > indexSize - offset) {
            limit = indexSize - offset;
        }

        renterAddresses = new address[](limit);
        totalRentalDurations = new uint256[](limit);

        for (uint256 i = 0; i < limit; i++) {
            (address renter, uint256 totalRentalDuration) = _rentersTotalRentalDuration.at(offset + i);
            renterAddresses[i] = renter;
            totalRentalDurations[i] = totalRentalDuration;
        }
    }

    /**
     * @inheritdoc IStandardWarper
     */
    function getRentersCount() external view returns (uint256) {
        return _rentersTotalRentalDuration.length();
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IAssetRentabilityMechanics).interfaceId ||
            interfaceId == type(IZeroBalanceWarper).interfaceId ||
            interfaceId == type(IStandardWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
