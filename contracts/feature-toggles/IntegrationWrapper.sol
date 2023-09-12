// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IntegrationFeatureRegistry.sol";
import "./IFeatureController.sol";

/**
 * @title IntegrationWrapper
 * @notice Manages integration features and storage.
 * @dev Interacts with IntegrationFeatureRegistry for feature operations.
 */
contract IntegrationWrapper {   

    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    /**
     * @dev Initializes with IntegrationFeatureRegistry address.
     * @param _integrationFeatureRegistry Address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
    }

    /**
     * @notice WIP
     * @dev Executes a feature.
     * @param featureId ID of the feature.
     * @return Execution result.
     */
    function executeFeature(uint256 featureId) public view returns (uint256) {
        address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureId);
        IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);
        return featureControllerInstance.execute(address(this));
    }

    /**
     * @dev Executes an array of features sequentially.
     * @param featureIds Array of feature IDs.
     * @return Array of execution results.
     */
    function executeFeatures(uint256[] memory featureIds) public view returns (uint256[] memory) {
        uint256[] memory results = new uint256[](featureIds.length);

        for (uint256 i = 0; i < featureIds.length; i++) {
            results[i] = executeFeature(featureIds[i]);
        }

        return results;
    }

    /**
     * @dev Checks if a feature is active.
     * @param featureId Feature's ID.
     * @return Whether the feature is active.
     */
    function isFeatureActive(uint256 featureId) external view returns (bool) {
        return integrationFeatureRegistry.featureEnabled(address(this), featureId);
    }

    /**
     * @dev Retrieves the address of a feature controller.
     * @param featureId Feature's ID.
     * @return Feature controller's address.
     */
    function getFeatureControllerAddress(uint256 featureId) external view returns (address) {
        return integrationFeatureRegistry.featureControllers(featureId);
    }

}
