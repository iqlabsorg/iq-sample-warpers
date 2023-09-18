// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/listing/listing-terms-registry/IListingTermsRegistry.sol";
import "@iqprotocol/iq-space-protocol/contracts/tax/tax-terms-registry/ITaxTermsRegistry.sol";

import "../zero-balance/IZeroBalanceWarper.sol";

interface IStandardWarper is IZeroBalanceWarper {
    /**
     * @dev Returns the allowance for multiple rentals
     * @return True if multiple rentals are allowed, false otherwise.
     */
    function allowsMultipleRentals() external view returns (bool);

    /**
     * @dev Returns the allowance for concurrent rentals
     * @return True if concurrent rentals are allowed, false otherwise.
     */
    function allowsConcurrentRentals() external view returns (bool);

    /**
     * @dev Returns the total number of rentals.
     * @return Amount of total rentals.
     */
    function getRenterRentalsCount(address renter, uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the paginated array of renters and total durations.
     * @param offset The offset of the first renter to return.
     * @param limit The maximum number of renters to return.
     * @return renterAddresses The array of renter addresses.
     * @return totalRentalDurations The array of total rental durations.
     */
    function getTotalRentalDurations(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory renterAddresses, uint256[] memory totalRentalDurations);

    /**
     * @dev Returns the total number of renters.
     * @return Amount of total renters.
     */
    function getRentersCount() external view returns (uint256);
}
