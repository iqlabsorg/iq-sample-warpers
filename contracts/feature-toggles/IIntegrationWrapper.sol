// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IIntegrationWrapper {

    /**
     * @notice Executes the specified feature.
     * @param featureId The ID of the feature to execute.
     * @return A uint256 result from the execution.
     */
    function executeFeature(uint256 featureId) external view returns (uint256);

    /**
     * @notice Determines if a feature is active.
     * @param featureId ID of the feature.
     * @return A boolean indicating if the feature is active.
     */
    function isFeatureActive(uint256 featureId) external view returns (bool);

    /**
     * @notice Returns the address of the specified feature controller.
     * @param featureId The ID of the feature.
     * @return Feature controller address.
     */
    function getFeatureControllerAddress(uint256 featureId) external view returns (address);
}
