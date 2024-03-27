// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../IFeatureController.sol";

interface IMinimumThreshold is IFeatureController {
    /**
     * @notice Sets the required NFT collections and their minimum holdings.
     * @param integrationAddress Address of integration.
     * @param collectionAddresses List of required collection addresses.
     * @param minimumThresholds Required NFT counts for each collection.
     */
    function setIntegration(
        address integrationAddress,
        address[] calldata collectionAddresses,
        uint256[] calldata minimumThresholds
    ) external;

    /**
     * @notice Fetches required collection addresses for an integration.
     * @param integrationAddress Address of integration.
     * @return List of required collection addresses.
     */
    function getRequiredCollectionAddresses(address integrationAddress) external view returns (address[] memory);

    /**
     * @notice Fetches required NFT holdings for an integration.
     * @param integrationAddress Address of integration.
     * @return List of required NFT counts for each collection.
     */
    function getRequiredCollectionMinimumThresholds(address integrationAddress)
        external
        view
        returns (uint256[] memory);
}
