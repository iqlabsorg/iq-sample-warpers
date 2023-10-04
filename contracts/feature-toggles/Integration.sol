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
contract Integration is IAssetRentabilityMechanics, ExternalRewardWarper, IIntegration {
    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    /**
     * @dev Initializes with IntegrationFeatureRegistry address.
     */
    constructor(address _integrationFeatureRegistry, bytes memory config) ExternalRewardWarper(config) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
    }

    /**
     * @notice Represents the result of a feature execution.
     */
    struct ExecutionResult {
        bool success; //Indicates whether the feature was executed successfully.
        string message; //Contains an error or success message from the feature execution.
    }

    function executeFeature(
        uint256 featureId,
        IFeatureController.ExecutionObject calldata executionObject
    ) public returns (bool, string memory) {
        if (!isFeatureActive(featureId)) {
            return (false, "Feature is not active");
        }

        address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureId);
        IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);
        (bool success, string memory message) = featureControllerInstance.execute(address(this), executionObject);
        return (success, message);
    }

    /**
     * @inheritdoc IAssetRentabilityMechanics
     * @notice The asset is rentable when all feature-checks passed with true.
     */
    function __isRentableAsset(
        address renter,
        uint256 tokenId,
        uint256 amount
    ) external view returns (bool isRentable, string memory errorMessage) {
        // Fetching the enabled featureIds for this integration.
        uint256[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));

        for (uint256 i = 0; i < featureIds.length; i++) {
            address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureIds[i]);
            IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);

            IFeatureController.CheckObject memory checkObj = IFeatureController.CheckObject({
                renter: renter,
                tokenId: tokenId,
                amount: amount
            });

            (bool featureSuccess, string memory message) = featureControllerInstance.check(address(this), checkObj);
            if (!featureSuccess) {
                return (false, message);
            }
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
