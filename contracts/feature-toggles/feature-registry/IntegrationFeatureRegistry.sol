// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/warper-manager/IWarperManager.sol";
import "@iqprotocol/iq-space-protocol/contracts/contract-registry/ContractEntity.sol";
import "@iqprotocol/iq-space-protocol/contracts/contract-registry/Contracts.sol";
import "@iqprotocol/iq-space-protocol/contracts/acl/direct/IACL.sol";
import "@iqprotocol/iq-space-protocol/contracts/acl/Roles.sol";
import "../contract-registry/IntegrationContracts.sol";
import "../acl/IntegrationRoles.sol";
import "./IIntegrationFeatureRegistry.sol";

/**
 * @title IntegrationFeatureRegistry
 * @notice Manages feature registration for integrations.
 */
contract IntegrationFeatureRegistry is IIntegrationFeatureRegistry, Context, ContractEntity {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    IACL internal _aclContract;

    mapping(address => bool) internal featureControllerInUse;
    mapping(bytes4 => address) public featureControllers;
    mapping(address => bytes4) internal featureIds;
    mapping(address => mapping(bytes4 => bool)) internal featureEnabled;

    EnumerableSetUpgradeable.AddressSet private featureAddresses;

    constructor(address metahub, address aclContract) ContractEntity() {
        _metahub = IMetahub(metahub);
        _aclContract = IACL(aclContract);
    }

    /**
     * @dev Thrown when the `account` is not an Integration Features Admin.
     * @param account The account that was checked.
     */
    error CallerIsNotIntegrationFeaturesAdmin(address account);

    /**
     * @dev Thrown when the `account` is not a Warper admin for `integration`.
     * @param integration The Integration address.
     * @param owner The account that was checked.
     */
    error CallerIsNotIntegrationOwner(address integration, address owner);

    /**
     * @dev Modifier to check is runner has INTEGRATION_FEATURES_ADMIN role
     */
    modifier onlyAuthorizedIntegratedFeatureAdmin() {
        if (!_isIntegrationFeaturesAdminAddress(_msgSender()) && !_aclContract.hasRole(Roles.ADMIN, _msgSender())) {
            revert CallerIsNotIntegrationFeaturesAdmin(_msgSender());
        }
        _;
    }

    /**
     * @dev Modifier to check is runner has INTEGRATION_FEATURES_ADMIN role
     */
    modifier onlyAuthorizedIntegrationOwner(address integration) {
        if (_isIntegrationOwner(integration, _msgSender())) {
            revert CallerIsNotIntegrationOwner(integration, _msgSender());
        }
        _;
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function registerFeature(bytes4 featureId, address featureController)
        external
        onlyAuthorizedIntegratedFeatureAdmin
    {
        require(featureControllerInUse[featureController] == false, "Feature controller already in use");
        require(featureControllers[featureId] == address(0), "Feature already registered");
        featureAddresses.add(featureController);
        featureControllers[featureId] = featureController;
        featureIds[featureController] = featureId;
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function deregisterFeature(bytes4 featureId) external onlyAuthorizedIntegratedFeatureAdmin {
        address featureController = featureControllers[featureId];
        require(featureController != address(0), "Feature not registered");
        featureAddresses.remove(featureController);
        delete featureControllers[featureId];
        delete featureIds[featureController];
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function enableFeatureForIntegration(address integrationContract, bytes4 featureId)
        external
        // TODO will require unit testing with real integration
        // onlyAuthorizedIntegrationOwner(integrationContract)
    {
        require(featureControllers[featureId] != address(0), "Feature does not exist");
        featureEnabled[integrationContract][featureId] = true;
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function disableFeatureForIntegration(address integrationContract, bytes4 featureId)
        external
        // TODO will require unit testing with real integration
        // onlyAuthorizedIntegrationOwner(integrationContract)
    {
        require(featureEnabled[integrationContract][featureId], "Feature not enabled");
        featureEnabled[integrationContract][featureId] = false;
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function isEnabledFeature(address integrationContract, bytes4 featureId) external view returns (bool) {
        return featureEnabled[integrationContract][featureId];
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function isIntegrationOwner(address integration, address account) external view returns (bool) {
        return _isIntegrationOwner(integration, account);
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function getFeatureController(bytes4 featureId) external view returns (address) {
        return featureControllers[featureId];
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function getAllFeatures()
        external
        view
        returns (bytes4[] memory featureIdsArray, address[] memory featureControllersArray)
    {
        uint256 featureCount = featureAddresses.length();
        featureIdsArray = new bytes4[](featureCount);
        featureControllersArray = new address[](featureCount);

        for (uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            featureIdsArray[i] = featureIds[featureController];
            featureControllersArray[i] = featureController;
        }
        return (featureIdsArray, featureControllersArray);
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function getAllIntegrationFeatures(address integrationContract)
        external
        view
        returns (bytes4[] memory enabledFeatureIdsArray, address[] memory enabledFeatureControllersArray)
    {
        uint256 featureCount = featureAddresses.length();
        uint256 enabledFeatureCount = 0;

        for (uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            bytes4 featureId = featureIds[featureController];
            if (featureEnabled[integrationContract][featureId]) {
                enabledFeatureCount++;
            }
        }

        enabledFeatureIdsArray = new bytes4[](enabledFeatureCount);
        enabledFeatureControllersArray = new address[](enabledFeatureCount);

        uint256 currentIndex = 0;
        for (uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            bytes4 featureId = featureIds[featureController];
            if (featureEnabled[integrationContract][featureId]) {
                enabledFeatureIdsArray[currentIndex] = featureId;
                enabledFeatureControllersArray[currentIndex] = featureController;
                currentIndex++;
            }
        }
        return (enabledFeatureIdsArray, enabledFeatureControllersArray);
    }

    /**
     * @inheritdoc IIntegrationFeatureRegistry
     */
    function getEnabledFeatureIds(address integrationContract)
        external
        view
        returns (bytes4[] memory enabledFeatureIdsArray)
    {
        uint256 featureCount = featureAddresses.length();
        uint256 enabledFeatureCount = 0;

        // Count enabled features
        for (uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            bytes4 featureId = featureIds[featureController];
            if (featureEnabled[integrationContract][featureId]) {
                enabledFeatureCount++;
            }
        }

        // Allocate memory for the result array
        enabledFeatureIdsArray = new bytes4[](enabledFeatureCount);

        uint256 currentIndex = 0;
        for (uint256 i = 0; i < featureCount; i++) {
            address featureController = featureAddresses.at(i);
            bytes4 featureId = featureIds[featureController];
            if (featureEnabled[integrationContract][featureId]) {
                enabledFeatureIdsArray[currentIndex] = featureId;
                currentIndex++;
            }
        }

        return enabledFeatureIdsArray;
    }

    /**
     * @inheritdoc IContractEntity
     */
    function contractKey() external pure override returns (bytes4) {
        return IntegrationContracts.INTEGRATION_FEATURE_REGISTRY;
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(ContractEntity, IERC165) returns (bool) {
        return interfaceId == type(IIntegrationFeatureRegistry).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Check if `account` is a Integration Owner for `integration`.
     * @param integration The Integration address.
     * @param account The account to check.
     */
    function _isIntegrationOwner(address integration, address account) internal view returns (bool) {
        return IWarperManager(_metahub.getContract(Contracts.WARPER_MANAGER)).isWarperAdmin(integration, account);
    }

    /**
     * @dev Check if `account` is a Integration Features Admin.
     * @param account The account to check.
     */
    function _isIntegrationFeaturesAdminAddress(address account) internal view returns (bool) {
        return _aclContract.hasRole(IntegrationRoles.INTEGRATION_FEATURES_ADMIN, account);
    }
}
