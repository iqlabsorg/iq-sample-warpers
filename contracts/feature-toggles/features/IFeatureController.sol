// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/Rentings.sol";
import "@iqprotocol/iq-space-protocol/contracts/accounting/Accounts.sol";

import "../feature-registry/IntegrationFeatureRegistry.sol";

/**
 * @title Interaface for Feature Controllers Contracts.
 * @notice Provides an interface for executing and checking features.
 */
interface IFeatureController is IERC165 {
    /**
     * @dev Thrown when feature does not implement the required interface.
     */
    error InvalidFeatureInterface();

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
        Rentings.Params rentingParams;
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
    function execute(address integrationAddress, ExecutionObject memory executionObject)
        external
        returns (bool success, string memory errorMessage);

    /**
     * @notice Checks the feasibility or eligibility based on the provided parameters.
     * @param integrationAddress Address of the integration instance.
     * @param checkObject Contains essential parameters for the check.
     * @return isRentable Indicates whether the asset or NFT is rentable.
     * @return errorMessage Contains an error message if the check determines the asset isn't rentable.
     */
    function check(address integrationAddress, CheckObject calldata checkObject)
        external
        view
        returns (bool isRentable, string memory errorMessage);

    /**
     * @notice Checks whether the feature is enabled.
     * @param integrationAddress Address of the integration instance.
     * @return isEnabled Indicates whether the feature is enabled.
     */
    function isEnabledFeature(address integrationAddress) external view returns (bool);

    /**
     * @dev Returns the feature ID.
     */
    function featureId() external view returns (bytes4);
}
