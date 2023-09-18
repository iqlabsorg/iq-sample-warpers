// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../standard-warper/IStandardWarper.sol";

interface IMinimumThresholdWarperV2 is IStandardWarper {
    /**
     * @dev Reverts if minimum thresholds length are different.
     */
    error InvalidMinimumThresholdsLength();

    /**
     * @dev Reverts if NFT collection address is zero.
     */
    error ZeroAddressCollection();

    /**
     * @dev Reverts if minimum threshold is zero.
     */
    error ZeroThreshold();

    /**
     * @dev Emits when minimum thresholds are set.
     * @param requiredCollectionAddresses Addresses of required collections.
     * @param requiredCollectionMinimumThresholds Minimum thresholds.
     */
    event MinimumTresholdsSet(address[] requiredCollectionAddresses, uint256[] requiredCollectionMinimumThresholds);

    /**
     * @dev Sets minimum thresholds.
     * @param requiredCollectionAddresses Addresses of required collections.
     * @param requiredCollectionMinimumThresholds Minimum thresholds.
     */
    function setMinimumThresholds(
        address[] memory requiredCollectionAddresses,
        uint256[] memory requiredCollectionMinimumThresholds
    ) external;

    /**
     * @dev Returns minimum thresholds.
     * @return requiredCollectionAddresses Addresses of required collections.
     * @return requiredCollectionMinimumThresholds Minimum thresholds.
     */
    function getMinimumThresholds()
        external
        view
        returns (address[] memory requiredCollectionAddresses, uint256[] memory requiredCollectionMinimumThresholds);
}
