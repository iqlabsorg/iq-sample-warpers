// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Context.sol";

import "./IFeatureController.sol";

abstract contract FeatureController is Context, IFeatureController {
    /**
     * @dev The Warper Integration Feature Registry.
     */
    IntegrationFeatureRegistry internal _integrationFeatureRegistry;

    /**
     * @dev Thrown when the `feature` is disabled.
     * @param feature The feature that was checked.
     * @param integrationAddress The Integration address.
     */
    error FeatureIsDisabled(bytes32 feature, address integrationAddress);

    /**
     * @dev Thrown when the `account` is not a Warper admin for `integration`.
     * @param integration The Integration address.
     * @param owner The account that was checked.
     */
    error CallerIsNotIntegrationOwner(address integration, address owner);

    /**
     * @dev Thrown when the `account` is not a Warper admin for `integration`.
     * @param integration The address of integration.
     * @param caller The address provided (_msgSender()).
     */
    error CallerIsNotAnIntegrationContract(address integration, address caller);

    modifier onlyEnabledFeatures(address integration) {
        if (!isEnabledFeature(integration)) {
            revert FeatureIsDisabled(integration);
        }
        _;
    }

    modifier onlyIntegration(address integrationAddress) {
        if (integrationAddress != _msgSender()) {
            revert CallerIsNotAnIntegrationContract(integrationAddress, _msgSender());
        }
        _;
    }

    modifier onlyAuthorizedIntegrationOwner(address integration) {
        if (
            _integrationFeatureRegistry.isIntegrationOwner(integration, _msgSender())
        ) {
            revert CallerIsNotIntegrationOwner(integration, _msgSender());
        }
        _;
    }

    /**
     * @inheritdoc IFeatureController
     */
    function execute(address integrationAddress, ExecutionObject memory executionObject) external virtual returns (bool success, string memory errorMessage);

    /**
     * @inheritdoc IFeatureController
     */
    function check(address integrationAddress, CheckObject calldata checkObject) external virtual view returns (bool isRentable, string memory errorMessage);

    /**
     * @inheritdoc IFeatureController
     */
    function isEnabledFeature(address integrationAddress) external virtual view returns (bool) {
        return _integrationFeatureRegistry.isEnabledFeature(integrationAddress);
    }
}