// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./IFeatureController.sol";

abstract contract FeatureController is Context, IFeatureController, ERC165 {
    /**
     * @dev Feature ID.
     */
    bytes4 internal _featureId;

    /**
     * @dev The Warper Integration Feature Registry.
     */
    IntegrationFeatureRegistry internal _integrationFeatureRegistry;

    /**
     * @dev Thrown when the `feature` is disabled.
     * @param integrationAddress The Integration address.
     * @param featureId The feature that was checked.
     */
    error FeatureIsDisabled(address integrationAddress, bytes4 featureId);

    /**
     * @dev Thrown when the `account` is not a Warper admin for `integration`.
     * @param integrationAddress The Integration address.
     * @param owner The account that was checked.
     */
    error CallerIsNotIntegrationOwner(address integrationAddress, address owner);

    /**
     * @dev Thrown when the `account` is not a Warper admin for `integration`.
     * @param integrationAddress The address of integrationAddress.
     * @param caller The address provided (_msgSender()).
     */
    error CallerIsNotAnIntegrationContract(address integrationAddress, address caller);

    modifier onlyEnabledFeatures(address integrationAddress) {
        if (!isEnabledFeature(integrationAddress)) {
            revert FeatureIsDisabled(integrationAddress, _featureId);
        }
        _;
    }

    modifier onlyIntegration(address integrationAddress) {
        if (integrationAddress != _msgSender()) {
            revert CallerIsNotAnIntegrationContract(integrationAddress, _msgSender());
        }
        _;
    }

    modifier onlyAuthorizedIntegrationOwner(address integrationAddress) {
        if (_integrationFeatureRegistry.isIntegrationOwner(integrationAddress, _msgSender())) {
            revert CallerIsNotIntegrationOwner(integrationAddress, _msgSender());
        }
        _;
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
        return interfaceId == type(IFeatureController).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @inheritdoc IFeatureController
     */
    function isEnabledFeature(address integrationAddress) public view virtual returns (bool) {
        return _integrationFeatureRegistry.isEnabledFeature(integrationAddress, _featureId);
    }

    /**
     * @inheritdoc IFeatureController
     */
    function featureId() public view virtual returns (bytes4) {
        return _featureId;
    }
}
