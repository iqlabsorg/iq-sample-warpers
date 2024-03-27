// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../standard-warper/StandardWarper.sol";
import "./IMinimumThresholdWarperV2.sol";

/**
 * @title Minimum Threshold Warper
 * @dev Warper lets a user rent an NFT only when they have a minimum number of NFTs from a certain collection.
 */
contract MinimumThresholdWarperV2 is StandardWarper, IMinimumThresholdWarperV2 {
    /**
     * @dev An array storing the addresses of NFT collections a user must own token from to be eligible for renting.
     * Each address corresponds to a different NFT collection.
     * The ownership status of NFTs from these collections will be checked for each user.
     */
    address[] private _requiredCollectionAddresses;

    /**
     * @dev An array storing the minimum number of NFTs a user must own from each collection to be eligible for renting.
     * Each element in this array corresponds to the minimum holding required for the respective NFT collection in 'collectionAddresses'.
     */
    uint256[] private _requiredCollectionMinimumThresholds;

    /**
     * @dev Constructor for the ZeroBalanceWarper contract.
     */
    constructor(bytes memory config) StandardWarper(config) {
        (
            ,
            ,
            ,
            ,
            ,
            ,
            address[] memory requiredCollectionAddresses,
            uint256[] memory requiredMinimumCollectionAmountThresholds
        ) = abi.decode(config, (address, address, address, address[], bool, bool, address[], uint256[]));

        setMinimumThresholds(requiredCollectionAddresses, requiredMinimumCollectionAmountThresholds);
    }

    /**
     * @inheritdoc IMinimumThresholdWarperV2
     */
    function setMinimumThresholds(
        address[] memory requiredCollectionAddresses,
        uint256[] memory requiredCollectionMinimumThresholds
    ) public override onlyOwner {
        if (requiredCollectionAddresses.length != requiredCollectionMinimumThresholds.length) {
            revert InvalidMinimumThresholdsLength();
        }

        for (uint256 i = 0; i < requiredCollectionAddresses.length; i++) {
            if (requiredCollectionAddresses[i] == address(0)) {
                revert ZeroAddressCollection();
            }
            if (requiredCollectionMinimumThresholds[i] == 0) {
                revert ZeroThreshold();
            }
        }

        _requiredCollectionAddresses = requiredCollectionAddresses;
        _requiredCollectionMinimumThresholds = requiredCollectionMinimumThresholds;

        emit MinimumTresholdsSet(requiredCollectionAddresses, requiredCollectionMinimumThresholds);
    }

    /**
     * @inheritdoc IAssetRentabilityMechanics
     * @notice The asset is rentable when the renter has minimum number of NFTs from required collections
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
            return (false, "Asset is already rented!");
        }

        for (uint256 i = 0; i < _zeroBalanceCheckAddresses.length; i++) {
            if (IERC721(_zeroBalanceCheckAddresses[i]).balanceOf(renter) > 0) {
                return (false, "Renter holds NFTs from restricted collection");
            }
        }

        for (uint256 i = 0; i < _requiredCollectionAddresses.length; i++) {
            if (IERC721(_requiredCollectionAddresses[i]).balanceOf(renter) < _requiredCollectionMinimumThresholds[i]) {
                return (false, "Renter has not enough NFTs from required collections");
            }
        }

        return (true, "");
    }

    /**
     * @inheritdoc IMinimumThresholdWarperV2
     */
    function getMinimumThresholds()
        public
        view
        override
        returns (address[] memory requiredCollectionAddresses, uint256[] memory requiredCollectionMinimumThresholds)
    {
        return (_requiredCollectionAddresses, _requiredCollectionMinimumThresholds);
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IAssetRentabilityMechanics).interfaceId ||
            interfaceId == type(IRentalPeriodMechanics).interfaceId ||
            interfaceId == type(IStandardWarper).interfaceId ||
            interfaceId == type(IMinimumThresholdWarperV2).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
