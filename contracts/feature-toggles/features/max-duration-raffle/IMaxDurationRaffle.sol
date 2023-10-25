// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../IFeatureController.sol";

interface IMaxDurationRaffle is IFeatureController {

    /**
     * @notice Set rental periods for specific integration.
     * minDuration and maxDuration are required here in order to provide
     * a way to set an equal raffle rules for everyone.
     * e.g. minDuration = 3600 (1 hour in seconds)
     * e.g. maxDuration = 3600 (1 hour in seconds)
     * Also this should be acknowledged during the listing creation.
     * So all listings created should max lock period equal to 3600 seconds (1 day).
     * @param integrationAddress address of specific integration.
     * @param minDuration minimum rental duration in secods.
     * @param maxDuration maximum rental duration in secods.
     */
    function setRentalPeriods(
        address integrationAddress,
        uint32 minDuration,
        uint32 maxDuration
        ) external returns (uint256);

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
    function getTotalRentalDurations(address integrationAddress, uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory renterAddresses, uint256[] memory totalRentalDurations);
}