// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@iqprotocol/iq-space-protocol/contracts/renting/Rentings.sol";
import "@iqprotocol/iq-space-protocol/contracts/accounting/Accounts.sol";

/**
 * @title Interaface for Feature Controllers Contracts.
 * @notice Provides an interface for executing and checking features.
 */
interface IFeatureController {

    /**
     * @notice Represents the essential parameters required for feature execution.
     */
    struct ExecutionObject {
        uint256 rentalId;
        Rentings.Agreement rentalAgreement;
        Accounts.RentalEarnings rentalEarnings;
    }

    /**
     * @notice Represents the essential parameters required for feature check.
     */
    struct CheckObject {
        address renter;
        uint256 tokenId;
        uint256 amount;
    }

    /**
     * @notice Executes the feature based on the provided parameters.
     * @param integrationAddress Address of the integration instance.
     * @param executionObject Contains essential parameters for the execution.
     * @return success Indicates whether the feature was executed successfully.
     * @return errorMessage Contains an error message if the execution fails.
     */
    function execute(address integrationAddress, ExecutionObject calldata executionObject) external returns (bool success, string memory errorMessage);

    /**
     * @notice Checks the feasibility or eligibility based on the provided parameters.
     * @param integrationAddress Address of the integration instance.
     * @param checkObject Contains essential parameters for the check.
     * @return isRentable Indicates whether the asset or NFT is rentable.
     * @return errorMessage Contains an error message if the check determines the asset isn't rentable.
     */
    function check(address integrationAddress, CheckObject calldata checkObject) external view returns (bool isRentable, string memory errorMessage);

}
