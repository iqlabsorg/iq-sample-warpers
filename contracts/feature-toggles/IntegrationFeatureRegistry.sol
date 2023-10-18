// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

/**
 * @title IntegrationFeatureRegistry
 * @notice Manages feature registration for integrations.
 */
contract IntegrationFeatureRegistry {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    mapping (address => bool) public featureControllerInUse;
    mapping(uint256 => address) public featureControllers;
    mapping(address => uint256) public featureIds;
    mapping(address => mapping(uint256 => bool)) public featureEnabled;

    EnumerableSetUpgradeable.AddressSet private featureAddresses;

    /**
     * @dev Registers a feature.
     * @param featureId Unique identifier for the feature.
     * @param featureController Associated controller address.
     */
    function registerFeature(uint256 featureId, address featureController) external {
        require(featureControllerInUse[featureController] == false, "Feature controller already in use");
        require(featureControllers[featureId] == address(0), "Feature already registered");
        featureAddresses.add(featureController);
        featureControllers[featureId] = featureController;
        featureIds[featureController] = featureId;
    }

    /**
     * @dev Deregisters a feature.
     * @param featureId Unique identifier for the feature.
     */
    function deregisterFeature(uint256 featureId) external {
        address featureController = featureControllers[featureId];
        require(featureController != address(0), "Feature not registered");
        featureAddresses.remove(featureController);
        delete featureControllers[featureId];
        delete featureIds[featureController];
    }

    /**
     * @dev Enables a feature for an integration.
     * @param integrationContract Integration's address.
     * @param featureId Unique identifier for the feature.
     */
    function enableFeatureForIntegration(address integrationContract, uint256 featureId) external {
        require(featureControllers[featureId] != address(0), "Feature does not exist");
        featureEnabled[integrationContract][featureId] = true;
    }

    /**
     * @dev Disables a feature for an integration.
     * @param integrationContract Integration's address.
     * @param featureId Unique identifier for the feature.
     */
    function disableFeatureForIntegration(address integrationContract, uint256 featureId) external {
        require(featureEnabled[integrationContract][featureId], "Feature not enabled");
        featureEnabled[integrationContract][featureId] = false;
    }

    /**
     * @dev Returns the controller address for a feature.
     * @param featureId Unique identifier for the feature.
     * @return featureController Associated controller address.
    */
    function getFeatureController(uint256 featureId) external view returns (address) {
        return featureControllers[featureId];
    }

    /**
     * @dev Lists all registered features.
     * @return featureIdsArray Array of feature IDs.
     * @return featureControllersArray Array of their controllers.
     */
    function getAllFeatures() external view returns (
        uint256[] memory featureIdsArray,
        address[] memory featureControllersArray)
    {
        uint256 featureCount = featureAddresses.length();
        featureIdsArray = new uint256[](featureCount);
        featureControllersArray = new address[](featureCount);

        for(uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            featureIdsArray[i] = featureIds[featureController];
            featureControllersArray[i] = featureController;
        }
        return (featureIdsArray, featureControllersArray);
    }

    /**
     * @dev Lists enabled features for an integration.
     * @param integrationContract Integration's address.
     * @return enabledFeatureIdsArray Array of enabled feature IDs.
     * @return enabledFeatureControllersArray Array of their controllers.
     */
    function getAllIntegrationFeatures(address integrationContract) external view returns (
        uint256[] memory enabledFeatureIdsArray,
        address[] memory enabledFeatureControllersArray)
    {
        uint256 featureCount = featureAddresses.length();
        uint256 enabledFeatureCount = 0;

        for(uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            uint256 featureId = featureIds[featureController];
            if (featureEnabled[integrationContract][featureId]) {
                enabledFeatureCount++;
            }
        }

        enabledFeatureIdsArray = new uint256[](enabledFeatureCount);
        enabledFeatureControllersArray = new address[](enabledFeatureCount);

        uint256 currentIndex = 0;
        for(uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            uint256 featureId = featureIds[featureController];
            if (featureEnabled[integrationContract][featureId]) {
                enabledFeatureIdsArray[currentIndex] = featureId;
                enabledFeatureControllersArray[currentIndex] = featureController;
                currentIndex++;
            }
        }
        return (enabledFeatureIdsArray, enabledFeatureControllersArray);
    }

    /**
     * @dev Fetches all enabled feature IDs for a given integration contract.
     * @param integrationContract Address of the integration contract.
     * @return enabledFeatureIdsArray Array of enabled feature IDs.
     */
    function getEnabledFeatureIds(address integrationContract) external view returns (uint256[] memory enabledFeatureIdsArray) {
        uint256 featureCount = featureAddresses.length();
        uint256 enabledFeatureCount = 0;

        // Count enabled features
        for(uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            uint256 featureId = featureIds[featureController];
            if (featureEnabled[integrationContract][featureId]) {
                enabledFeatureCount++;
            }
        }

        // Allocate memory for the result array
        enabledFeatureIdsArray = new uint256[](enabledFeatureCount);

        uint256 currentIndex = 0;
        for(uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            uint256 featureId = featureIds[featureController];
            if (featureEnabled[integrationContract][featureId]) {
                enabledFeatureIdsArray[currentIndex] = featureId;
                currentIndex++;
            }
        }

        return enabledFeatureIdsArray;
    }
}
