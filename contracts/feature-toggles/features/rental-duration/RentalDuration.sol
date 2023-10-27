// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

import "../FeatureController.sol";
import "./IRentalDuration.sol";

/**
 * @title Rental Duration Feature.
 * @notice Helps specify minimum and maximum rental duration for specific Integration.
 */
contract RentalDuration is FeatureController, IRentalDuration {
    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    /**
     * @dev Reverted if the minimum rental duration is greater than the maximum rental duration.
     */
    error InvalidRentalDurationRange();

    /**
     * @dev Reverted if the set minimum rental duration exceeds the existing maximum duration.
     */
    error ExceedsMaxRentalDuration();

    /**
     * @dev Reverted if the set maximum rental duration is below the existing minimum duration.
     */
    error BelowMinRentalDuration();

    /**
     * @dev Emits when minimal and maximum rental duration addresses is set.
     * @param integrationAddress Integration address.
     * @param minDuration Minimal rental duration in seconds.
     * @param maxDuration Maximal rental duration in seconds.
     */
    event RentalDurationSet(address integrationAddress, uint32 minDuration, uint32 maxDuration);

    /**
     * @dev Store the minimal rental duration for the specified integration.
     * @notice Integration address => minimal rental duration in seconds.
     */
    mapping(address => uint32) private minRentalDuration;

    /**
     * @dev Store the maximal rental duration for the specified integration.
     * @notice Integration address => maximal rental duration in seconds.
     */
    mapping(address => uint32) private maxRentalDuration;

    /**
     * @dev Sets the address for the IntegrationFeatureRegistry.
     * @param _integrationFeatureRegistry Address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
        _featureId = bytes4(keccak256("RentalDuration"));
    }

    /**
     * @inheritdoc IRentalDuration
     */
    function setRentalDurations(
        address integrationAddress,
        uint32 minDuration,
        uint32 maxDuration
    ) external override onlyAuthorizedIntegrationOwner(integrationAddress) {
        if (minDuration > maxDuration) {
            revert InvalidRentalDurationRange();
        }

        minRentalDuration[integrationAddress] = minDuration;
        maxRentalDuration[integrationAddress] = maxDuration;

        emit RentalDurationSet(integrationAddress, minDuration, maxDuration);
    }

    /**
     * @notice Sets minimal rental duration for specific Integration.
     * @param integrationAddress The integration address for which the zero balance address needs to be added.
     * @param minDuration The NFT collection addresses for which the zero balance feature needs to be enabled.
     */
    function setMinRentalDuration(address integrationAddress, uint32 minDuration) internal {
        if (minDuration > maxRentalDuration[integrationAddress]) {
            revert ExceedsMaxRentalDuration();
        }

        minRentalDuration[integrationAddress] = uint32(minDuration);
    }

    /**
     * @notice Sets maximal rental duration for specific Integration.
     * @param integrationAddress The integration address for which the zero balance address needs to be added.
     * @param maxDuration The NFT collection addresses for which the zero balance feature needs to be enabled.
     */
    function setMaxRentalDuration(address integrationAddress, uint32 maxDuration) internal {
        if (maxDuration < minRentalDuration[integrationAddress]) {
            revert BelowMinRentalDuration();
        }

        maxRentalDuration[integrationAddress] = uint32(maxDuration);
    }

    /**
     * @inheritdoc IRentalDuration
     */
    function getMinRentalDuration(address integrationAddress) external view override returns (uint32) {
        return minRentalDuration[integrationAddress];
    }

    /**
     * @inheritdoc IRentalDuration
     */
    function getMaxRentalDuration(address integrationAddress) external view override returns (uint32) {
        return maxRentalDuration[integrationAddress];
    }

    /**
     * @inheritdoc IFeatureController
     */
    function check(
        address integrationAddress,
        CheckObject calldata checkObject
    ) external view override returns (bool isRentable, string memory errorMessage) {

    //DEVELOPMENT IN PROGRESS, IT WILL BE ADDED SOON
    uint32 rentalDuration = checkObject.rentingParams.rentalPeriod;

    if (rentalDuration < minRentalDuration[integrationAddress]) {
        return (false, "Rental duration shorter than minimal allowed");
    }

    if (rentalDuration > maxRentalDuration[integrationAddress]) {
        return (false, "Rental duration longer than maximal allowed");
    }

    return (true, "");
    }

    /**
     * @inheritdoc IFeatureController
     */
    function execute(
        address integrationAddress,
        ExecutionObject memory
    ) external override onlyIntegration(integrationAddress) returns (bool success, string memory errorMessage) {
        success = true;
        errorMessage = "Execution successful";
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(FeatureController, IERC165) returns (bool) {
        return interfaceId == type(IListingManager).interfaceId || super.supportsInterface(interfaceId);
    }
}
