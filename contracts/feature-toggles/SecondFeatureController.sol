// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IFeatureController.sol";
import "./IIntegrationWrapper.sol";
import "./IntegrationFeatureRegistry.sol";

/**
 * @title Minimum Thresholds Feature Controller
 * @notice Manages required NFT collection holdings for eligibility criteria.
 * @dev Interacts with the IntegrationWrapper for feature operations and storage.
 */
contract FeatureController is IFeatureController {

    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    // Stores the NFT collection addresses a user needs to own to be eligible.
    mapping(address => address[]) private _requiredCollectionAddresses;

    // Defines the minimum number of NFTs a user needs to hold from the respective collections.
    mapping(address => uint256[]) private _requiredCollectionMinimumThresholds;

    /**
     * @dev Sets the address for the IntegrationFeatureRegistry.
     * @param _integrationFeatureRegistry Address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
    }

    /**
     * @notice Fetches required collection addresses for an integration.
     * @param integrationAddress Address of integration.
     * @return List of required collection addresses.
     */
    function getRequiredCollectionAddresses(address integrationAddress) external view returns (address[] memory) {
        return _requiredCollectionAddresses[integrationAddress];
    }

    /**
     * @notice Fetches required NFT holdings for an integration.
     * @param integrationAddress Address of integration.
     * @return List of required NFT counts for each collection.
     */
    function getRequiredCollectionMinimumThresholds(address integrationAddress) external view returns (uint256[] memory) {
        return _requiredCollectionMinimumThresholds[integrationAddress];
    }

    /**
     * @notice Sets the required NFT collections and their minimum holdings.
     * @param integrationAddress Address of integration.
     * @param collectionAddresses List of required collection addresses.
     * @param minimumThresholds Required NFT counts for each collection.
     */
    function setIntegration(address integrationAddress, address[] calldata collectionAddresses, uint256[] calldata minimumThresholds) external {
        require(collectionAddresses.length == minimumThresholds.length, "Mismatched array lengths");
        
        _requiredCollectionAddresses[integrationAddress] = collectionAddresses;
        _requiredCollectionMinimumThresholds[integrationAddress] = minimumThresholds;
    }

    /**
     * @notice Executes the feature and returns the count of required collections.
     * @param integrationAddress The IntegrationWrapper address.
     * @return Count of required NFT collections.
     */
    function execute(address integrationAddress) external view returns (uint256) {
        return _requiredCollectionAddresses[integrationAddress].length;
    }
}
