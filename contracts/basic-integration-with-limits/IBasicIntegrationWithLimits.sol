// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/listing/listing-terms-registry/IListingTermsRegistry.sol";
import "@iqprotocol/iq-space-protocol/contracts/tax/tax-terms-registry/ITaxTermsRegistry.sol";

interface IBasicIntegrationWithLimits {
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
     * @dev Emits when asset are rented.
     * @param renter Renter Address.
     * @param tokenId Asset token ID.
     * @param rentalId Asset rental ID.
     */
    event OnRentHookEvent(address renter, uint256 tokenId, uint256 rentalId);

    /**
     * @dev Returns the rental status for a given token ID.
     * @param tokenId Token ID.
     * @return Rental status.
     */
    function isRented(uint256 tokenId) external view returns (bool);

    /**
     * @dev Returns the remaining duration of the rental period for the given token.
     * @notice If the rental has already ended or the rental end time is not set, returns 0.
     * @param tokenId Rental ID.
     * @return Remaining duration of the rental period, in seconds.
     */
    function getRentalDuration(uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the last active rental ID for renter and token ID.
     * @param renter Renter address.
     * @param tokenId Token ID.
     * @return The last active rental ID.
     */
    function getLastActiveRenterRentalId(address renter, uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the last active rental ID for token ID.
     * @param tokenId Token ID.
     * @return The last active rental ID.
     */
    function getLastActiveRentalId(uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the rental details for a given rental ID.
     * @param rentalId Rental ID.
     * @return RentalDetails.
     */
    function getRentalDetails(uint256 rentalId) external view returns (RentalDetails memory);
}
