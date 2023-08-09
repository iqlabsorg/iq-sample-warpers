// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../external-reward/ExternalRewardWarper.sol";
import "./IMinimumThresholdWarper.sol";

/**
 * @title Minimum Threshold Warper
 * @dev Warper lets a user rent an NFT only when they have a minimum number of NFTs from a certain collection.
 */
contract MinimumThresholdWarper is IAssetRentabilityMechanics, IMinimumThresholdWarper, ExternalRewardWarper {
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
    uint256[] private _requiredCollectionMinimumThresholds;

    /**
     * @dev Constructor for the ZeroBalanceWarper contract.
     */
    constructor(bytes memory config) ExternalRewardWarper(config) {
        (
            ,
            ,
            ,
            address[] memory requiredCollectionAddresses,
            uint256[] memory requiredMinimumCollectionAmountThresholds
        ) = abi.decode(config, (address, address, address, address[], uint256[]));

        setMinimumThresholds(requiredCollectionAddresses, requiredMinimumCollectionAmountThresholds);
    }

    /**
     * @inheritdoc IMinimumThresholdWarper
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
        uint256,
        uint256
    ) external view override returns (bool isRentable, string memory errorMessage) {
        for (uint256 i = 0; i < _requiredCollectionAddresses.length; i++) {
            if (IERC721(_requiredCollectionAddresses[i]).balanceOf(renter) < _requiredCollectionMinimumThresholds[i]) {
                return (false, "Renter has not enough NFTs from required collections");
            }
        }

        return (true, "");
    }

    /**
     * @inheritdoc IMinimumThresholdWarper
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
            interfaceId == type(IAssetRentabilityMechanics).interfaceId ||
            interfaceId == type(IMinimumThresholdWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
