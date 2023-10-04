// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../external-reward/IExternalRewardWarper.sol";
import "./IFeatureController.sol";

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
    function executeFeature(uint256 featureId, IFeatureController.ExecutionObject calldata executionObject) external returns (bool, string memory);



    function checkAll(address renter, uint256 tokenId, uint256 amount) external view returns (ExecutionResult[] memory results);

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

