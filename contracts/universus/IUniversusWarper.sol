// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/listing/listing-terms-registry/IListingTermsRegistry.sol";
import "@iqprotocol/iq-space-protocol/contracts/tax/tax-terms-registry/ITaxTermsRegistry.sol";

interface IUniversusWarper {
    /**
     * @dev Struct defining the rental details.
     * @param listingTerms Listing terms information.
     * @param universeTaxTerms Universe tax terms information.
     * @param protocolTaxTerms Protocol tax terms information.
     * @param rentalId Asset rental ID.
     * @param listingId Asset listing ID.
     */
    struct RentalDetails {
        IListingTermsRegistry.ListingTerms listingTerms;
        ITaxTermsRegistry.TaxTerms universeTaxTerms;
        ITaxTermsRegistry.TaxTerms protocolTaxTerms;
        uint256 rentalId;
        uint256 listingId;
    }

    /**
     * @dev Returns the last active rental ID for renter and token ID.
     * @param renter Renter address.
     * @param tokenId Token ID.
     * @return The last active rental ID.
     */
    function getLastActiveRentalId(address renter, uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the rental details for a given rental ID.
     * @param rentId Rental ID.
     * @return RentalDetails.
     */
    function getRentalDetails(uint256 rentId) external view returns (RentalDetails memory);
}