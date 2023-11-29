// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";

import "../external-reward/IExternalRewardWarper.sol";
import "./features/IFeatureController.sol";

interface IIntegration is IRentingHookMechanics {
    /**
     * @dev Struct defining the rental details.
     * @param listingTerms Listing terms information.
     * @param universeTaxTerms Universe tax terms information.
     * @param protocolTaxTerms Protocol tax terms information.
     * @param rentalId Asset rental ID.
     * @param listingId Asset listing ID.
     * @param lister Lister address.
     * @param protocol Protocol address.
     */
    struct RentalDetails {
        IListingTermsRegistry.ListingTerms listingTerms;
        ITaxTermsRegistry.TaxTerms universeTaxTerms;
        ITaxTermsRegistry.TaxTerms protocolTaxTerms;
        uint256 rentalId;
        uint256 listingId;
        address lister;
        address protocol;
    }

    /**
     * @dev Represents the essential parameters required for feature execution.
     * @param rentalId Rental ID.
     * @param rentalAgreement Details about the rental agreement.
     * @param rentalEarnings Earnings associated with the rental.
     */
    struct ExecutionObject {
        uint256 rentalId;
        Rentings.Agreement rentalAgreement;
        Accounts.RentalEarnings rentalEarnings;
    }

    /**
     * @dev Represents the essential parameters required for feature execution.
     * @param featureId Unique bytes4 feature ID.
     * @param success Indicates if the feature execution was successful.
     * @param message An error message in case of failure in feature execution.
     */
    struct ExecutionResult {
        bytes4 featureId; //indicates feature ID of executed feature.
        bool success; //Indicates whether the feature was executed successfully.
        string message; //Contains an error or success message from the feature execution.
    }

    /**
     * @notice Represents the essential parameters required for feature execution.
     * @dev This struct is used to return the execution result of a feature.
     * @param tokenId Token ID.
     * @param executionResult Execution result.
     */
    struct TokenExecutionResult {
        uint256 tokenId;
        ExecutionResult[] executionResult;
    }

    /**
     * @dev Emits when asset are rented.
     * @param renter Renter Address.
     * @param tokenId Asset token ID.
     * @param rentalId Asset rental ID.
     */
    event OnRentHookEvent(address renter, uint256 tokenId, uint256 rentalId);

    /**
     * @notice Executes the specified feature.
     * @param featureId The ID of the feature to execute.
     * @param executionObject The object containing execution parameters.
     * @return A tuple indicating the success of the operation and an associated message.
     */
    function executeFeature(bytes4 featureId, IFeatureController.ExecutionObject calldata executionObject)
        external
        returns (bool, string memory);

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
     * @dev Assuming the ERC721WarperController validateRentingParams is using __isRentableAsset
     *      which lacks the parameters required for feature check execution
     *      FE or API will be using checkAll method directly on Integration contract
     *      to check if assets are rentable in addition to calling estimateRent.
     * @notice Checks if the specified assets from renting params are rentable.
     * @param rentingParams The renting parameters.
    */
    function checkAll(Rentings.Params calldata rentingParams) external view returns(TokenExecutionResult[] memory results);

    /**
     * @notice Returns the address of the specified feature controller.
     * @param featureId The ID of the feature.
     * @return Feature controller address.
     */
    function getFeatureControllerAddress(bytes4 featureId) external view returns (address);

    /**
     * @dev Returns the last active rental ID for renter and token ID.
     * @param renter Renter address.
     * @param tokenId Token ID.
     * @return The last active rental ID.
     */
    function getLastActiveRentalId(address renter, uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the rental details for a given rental ID.
     * @param rentalId Rental ID.
     * @return RentalDetails.
     */
    function getRentalDetails(uint256 rentalId) external view returns (RentalDetails memory);
}
