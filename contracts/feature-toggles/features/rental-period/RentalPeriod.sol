// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

import "../FeatureController.sol";
import "./IRentalPeriod.sol";

/**
 * @title Rental Period Feature.
 * @notice Manages rental period settings for specific integrations.
 */
contract RentalPeriod is FeatureController, IRentalPeriod {
    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    /**
     * @dev Emitted when the rental period settings for an integration are updated.
     * @param integrationAddress Address of the integration.
     * @param startTime New start time of the rental period as a UNIX timestamp.
     * @param endTime New end time of the rental period as a UNIX timestamp.
     */
    event RentalPeriodSet(address indexed integrationAddress, uint256 startTime, uint256 endTime);

    /**
     * @dev Thrown when the start time of the rental period is not earlier than the end time.
     */
    error InvalidRentalPeriod();

    /**
     * @dev Stores the rental period start time for specific integration.
     */
    mapping(address => uint256) internal rentalStart;

    /**
     * @dev Stores the rental period end time for specific integration.
     */
    mapping(address => uint256) internal rentalEnd;

    /**
     * @dev Sets the address for the IntegrationFeatureRegistry.
     * @param _integrationFeatureRegistry Address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
        _featureId = bytes4(keccak256("RentalPeriod"));
    }

    /**
     * @inheritdoc IRentalPeriod
     */
    function setRentalPeriod(
        address integrationAddress,
        uint256 startTime,
        uint256 endTime
    ) external override onlyAuthorizedIntegrationOwner(integrationAddress) {
        if (startTime >= endTime) {
            revert InvalidRentalPeriod();
        }

        rentalStart[integrationAddress] = startTime;
        rentalEnd[integrationAddress] = endTime;

        emit RentalPeriodSet(integrationAddress, startTime, endTime);
    }

    /**
     * @inheritdoc IRentalPeriod
     */
    function setRentalStart(
        address integrationAddress,
        uint256 newStartTime
    ) external onlyAuthorizedIntegrationOwner(integrationAddress) {
        if (newStartTime >= rentalEnd[integrationAddress]) {
            revert InvalidRentalPeriod();
        }
        rentalStart[integrationAddress] = newStartTime;
        emit RentalPeriodSet(integrationAddress, newStartTime, rentalEnd[integrationAddress]);
    }

    /**
     * @inheritdoc IRentalPeriod
     */
    function setRentalEnd(
        address integrationAddress,
        uint256 newEndTime
    ) external onlyAuthorizedIntegrationOwner(integrationAddress) {
        if (rentalStart[integrationAddress] >= newEndTime) {
            revert InvalidRentalPeriod();
        }
        rentalEnd[integrationAddress] = newEndTime;
        emit RentalPeriodSet(integrationAddress, rentalStart[integrationAddress], newEndTime);
    }

    /**
     * @inheritdoc IRentalPeriod
     */
    function getRentalPeriod(
        address integrationAddress
    ) external view override returns (uint256 startTime, uint256 endTime) {
        startTime = rentalStart[integrationAddress];
        endTime = rentalEnd[integrationAddress];
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
     * @inheritdoc IFeatureController
     */
    function check(
        address integrationAddress,
        CheckObject calldata checkObject
    ) external view override returns (bool isRentable, string memory errorMessage) {
        uint256 currentTimestamp = block.timestamp;
        uint256 startTime = rentalStart[integrationAddress];
        uint256 endTime = rentalEnd[integrationAddress];

        if (currentTimestamp < startTime) {
            return (false, "Rental period has not started yet");
        }

        if (currentTimestamp > endTime) {
            return (false, "Rental period is over");
        }

        return (true, "");
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(FeatureController, IERC165) returns (bool) {
        return interfaceId == type(IRentalPeriod).interfaceId || super.supportsInterface(interfaceId);
    }
}
