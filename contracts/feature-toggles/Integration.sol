// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./IntegrationFeatureRegistry.sol";
import "./IFeatureController.sol";
import "../external-reward/ExternalRewardWarper.sol";
import "./IIntegration.sol";

/**
 * @title Integration
 * @dev Warper allows a renter to rent an NFT only when their NFT balance for each defined address is zero, this name represents the core functionality quite accurately.
 */
abstract contract Integration is IAssetRentabilityMechanics, ExternalRewardWarper, IIntegration {

    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    /**
     * @dev Initializes with IntegrationFeatureRegistry address.
     * @param _integrationFeatureRegistry Address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
    }

    /**
     * @notice Represents the result of a feature execution.
     */
    struct ExecutionResult {
        // or add here
        bool success; //Indicates whether the feature was executed successfully.
        string message; //Contains an error or success message from the feature execution.
    }

    // TODO
    struct FeatureExecutionResult {
        uint256 featureId;
        ExecutionResult executionResult;
    }

    struct ExecutionObject {
        uint256 rentalId;
        Rentings.Agreement rentalAgreement;
        Accounts.RentalEarnings rentalEarnings;
    }

    struct CheckObject {
        address renter;
        uint256 tokenId;
        uint256 amount;
    }

    /**
     * @inheritdoc IRentingHookMechanics
     */
    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyRentingManager returns (bool, string memory) {
        address renter = rentalAgreement.renter;
        uint256[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));

        for (uint256 i = 0; i < featureIds.length; i++) {
            (bool featureSuccess, string memory message) = executeFeature(featureIds[i]);

            if (!featureSuccess) {
                return (false, message);
            }
        }

        return (true, "");
    }

    function __onRentv2(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external onlyRentingManager returns (bool, string memory) {
        address renter = rentalAgreement.renter;
        uint256[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));

        for (uint256 i = 0; i < featureIds.length; i++) {
            // IFeatureController.executev2(..)
        }

        return (true, "");
    }

    /**
     * @notice WIP
     * @dev Checks is the feature is active, then executes a feature.
     * @param featureId ID of the feature.
     * @return Execution result.
     */
    function executeFeature(uint256 featureId) public view returns (bool, string memory) {
        if (!isFeatureActive(featureId)) { return (false, "Feature is not active");}

        address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureId);
        IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);
        return featureControllerInstance.execute(msg.sender, address(this));
    }

    function executeFeaturev2(uint256 featureId, ExecutionObject calldata executionObject) public view returns (bool, string memory) {
        if (!isFeatureActive(featureId)) { return (false, "Feature is not active");}

        address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureId);
        IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);
        return featureControllerInstance.execute(msg.sender, address(this));
    }

    /**
     * @dev Executes an array of features sequentially.
     * @param featureIds Array of feature IDs.
     */
    function check(uint256[] memory featureIds) external view returns (ExecutionResult[] memory results) {
        ExecutionResult[] memory resultsArray = new ExecutionResult[](featureIds.length);

        for (uint256 i = 0; i < featureIds.length; i++) {
            (bool success, string memory message) = executeFeature(featureIds[i]);
            resultsArray[i] = ExecutionResult(success, message);
        }

        return resultsArray;
    }

    /**
     * @inheritdoc IAssetRentabilityMechanics
     * @notice The asset is rentable when all feature-checks passed with true.
     */
    function __isRentableAsset(
        address renter,
        uint256 tokenId,
        uint256 amount
    ) external view override returns (bool isRentable, string memory errorMessage) {
        // Fetching the enabled featureIds for this integration.
        uint256[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));

        for (uint256 i = 0; i < featureIds.length; i++) {
            (bool featureSuccess, string memory message) = executeFeature(featureIds[i]);

            if (!featureSuccess) {
                return (false, message);
            }
        }

        return (true, "");
    }

    function __isRentableAsset_v2(
        address renter,
        uint256 tokenId,
        uint256 amount
    ) external view returns (bool isRentable, string memory errorMessage) {
        // Fetching the enabled featureIds for this integration.
        uint256[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));

        for (uint256 i = 0; i < featureIds.length; i++) {
            // IFeatureController.checkv2(..);
        }

        return (true, "");
    }

    /**
     * @dev Checks if a feature is active.
     * @param featureId Feature's ID.
     * @return Whether the feature is active.
     */
    function isFeatureActive(uint256 featureId) public view returns (bool) {
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

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IAssetRentabilityMechanics).interfaceId ||
            // interfaceId == type(IZeroBalanceWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
