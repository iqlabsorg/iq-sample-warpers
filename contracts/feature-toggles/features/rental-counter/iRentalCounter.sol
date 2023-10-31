// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../IFeatureController.sol";

interface iRentalCounter is IFeatureController {

    /**
     * @notice Return quantity of renters for specific integration.
     */
    function getRentersCount(address integrationAddress) external view returns (uint256);

    /**
     * @notice Adds a new zero balance address for a given integration.
     * @param offset The integration address for which the zero balance address needs to be added.
     * @param limit The NFT collection addresses for which the zero balance feature needs to be enabled.
     * @return renterAddresses The array with renter addresses.
     * @return totalRentalDurations the array with rental durations corresponding to renterAddresses.
     */
    function getTotalRentalDurations(
        address integrationAddress,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory renterAddresses, uint256[] memory totalRentalDurations);
}
