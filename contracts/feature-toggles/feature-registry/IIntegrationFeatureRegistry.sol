// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@iqprotocol/iq-space-protocol/contracts/contract-registry/IContractEntity.sol";

/**
 * @title IIntegrationFeatureRegistry
 * @notice Interface for the IntegrationFeatureRegistry contract.
 */
interface IIntegrationFeatureRegistry is IContractEntity {
  /**
   * @dev Registers a feature.
   * @param featureId Unique identifier for the feature.
   * @param featureController Associated controller address.
   */
  function registerFeature(bytes4 featureId, address featureController) external;

  /**
   * @dev Deregisters a feature.
   * @param featureId Unique identifier for the feature.
   */
  function deregisterFeature(bytes4 featureId) external;

  /**
   * @dev Enables a feature for an integration.
   * @param integrationContract Integration's address.
   * @param featureId Unique identifier for the feature.
   */
  function enableFeatureForIntegration(address integrationContract, bytes4 featureId) external;

  /**
   * @dev Disables a feature for an integration.
   * @param integrationContract Integration's address.
   * @param featureId Unique identifier for the feature.
   */
  function disableFeatureForIntegration(address integrationContract, bytes4 featureId) external;

  /**
   * @dev Checks if a feature is registered.
   * @param integrationContract Integration's address.
   * @param featureId Unique identifier for the feature.
   */
  function isEnabledFeature(address integrationContract, bytes4 featureId) external view returns (bool);

  /**
   * @dev Checks if a `account` is an owner of `integration`.
   * @param integration Integration's address.
   * @param account Account's address.
   */
  function isIntegrationOwner(address integration, address account) external view returns (bool);

  /**
   * @dev Returns the controller address for a feature.
   * @param featureId Unique identifier for the feature.
   * @return featureController Associated controller address.
   */
  function getFeatureController(bytes4 featureId) external view returns (address);

  /**
   * @dev Lists all registered features.
   * @return featureIdsArray Array of feature IDs.
   * @return featureControllersArray Array of their controllers.
   */
  function getAllFeatures() external view returns (
      bytes4[] memory featureIdsArray,
      address[] memory featureControllersArray
  );

  /**
   * @dev Lists enabled features for an integration.
   * @param integrationContract Integration's address.
   * @return enabledFeatureIdsArray Array of enabled feature IDs.
   * @return enabledFeatureControllersArray Array of their controllers.
   */
  function getAllIntegrationFeatures(address integrationContract) external view returns (
      bytes4[] memory enabledFeatureIdsArray,
      address[] memory enabledFeatureControllersArray
  );

  /**
   * @dev Fetches all enabled feature IDs for a given integration contract.
   * @param integrationContract Address of the integration contract.
   * @return enabledFeatureIdsArray Array of enabled feature IDs.
   */
  function getEnabledFeatureIds(address integrationContract) external view returns (bytes4[] memory enabledFeatureIdsArray);
}
