// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../external-reward/IExternalRewardWarper.sol";
import "./features/IFeatureController.sol";

interface IIntegration is IExternalRewardWarper {
    /**
     * @notice Represents the essential parameters required for feature execution.
     */
    struct ExecutionObject {
        uint256 rentalId;
        Rentings.Agreement rentalAgreement;
        Accounts.RentalEarnings rentalEarnings;
    }

    /**
     * @notice Represents the essential parameters required for feature execution.
     */
    struct ExecutionResult {
        uint256 featureId; //indicates feature ID of executed feature.
        bool success; //Indicates whether the feature was executed successfully.
        string message; //Contains an error or success message from the feature execution.
    }

    /**
     * @notice Executes the specified feature.
     * @param featureId The ID of the feature to execute.
     * @param executionObject The object containing execution parameters.
     * @return A tuple indicating the success of the operation and an associated message.
     */
    function executeFeature(
        uint256 featureId,
        IFeatureController.ExecutionObject calldata executionObject
    ) external returns (bool, string memory);

    /**
     * @notice Triggers when a new rent action occurs, ensuring all active features execute successfully.
     * @param rentalId Unique identifier for the rental action.
     * @param rentalAgreement Details about the rental agreement.
     * @param rentalEarnings Earnings associated with the rental.
     * @return success Indicates if all feature executions were successful.
     * @return errorMessage An error message in case of failure in any feature execution.
     */
    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata rentalEarnings
    ) external returns (bool success, string memory errorMessage);

    /**
     * @notice Checks all active features for the given parameters.
     * @param renter Address of the user attempting the action.
     * @param tokenId ID of the token involved in the action.
     * @param amount The quantity or value associated with the action.
     * @return results An array of ExecutionResult, each indicating the success or failure (with an associated message) of each active feature's check.
     */
    function checkAll(
        address renter,
        uint256 tokenId,
        uint256 amount
    ) external view returns (ExecutionResult[] memory results);

    /**
     * @notice Determines if a feature is active.
     * @param featureId ID of the feature.
     * @return A boolean indicating if the feature is active.
     */
    function isFeatureActive(uint256 featureId) external view returns (bool);

    /**
     * @notice Returns the address of the specified feature controller.
     * @param featureId The ID of the feature.
     * @return Feature controller address.
     */
    function getFeatureControllerAddress(uint256 featureId) external view returns (address);
}
