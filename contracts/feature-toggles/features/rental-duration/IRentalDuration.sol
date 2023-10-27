// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../IFeatureController.sol";

interface IRentalDuration is IFeatureController {
    /**
     * @notice Adds a new zero balance address for a given integration.
     * @param integrationAddress The integration address for which the zero balance address needs to be added.
     * @param minDuration The NFT collection addresses for which the zero balance feature needs to be enabled.
     * @param maxDuration The NFT collection addresses for which the zero balance feature needs to be enabled.
     */
    function setRentalDurations(
        address integrationAddress,
        uint32 minDuration,
        uint32 maxDuration
    ) external;

    /**
     * @notice Sets the minimum rental duration for a given integration.
     * @param integrationAddress The integration address.
     * @param minDuration The minimum rental duration.
     */
    function setMinRentalDuration(
        address integrationAddress,
        uint32 minDuration
    ) external;

    /**
     * @notice Sets the maximum rental duration for a given integration.
     * @param integrationAddress The integration address.
     * @param maxDuration The maximum rental duration.
     */
    function setMaxRentalDuration(
        address integrationAddress,
        uint32 maxDuration
    ) external;

    /**
     * @notice Returns the minimum and maximum rental durations.
     * @param integrationAddress The address of Integration.
     */
    function getRentalDurations(address integrationAddress) external view returns (
        uint32 minDuration,
        uint32 maxDuration
    );

    /**
     * @notice Returns the miminal rental duration for specific Integration.
     * @param integrationAddress The address of Integration.
     * @return minDuration Minimal integration time in seconds.
     */
    function getMinRentalDuration(address integrationAddress) external view returns (uint32 minDuration);

    /**
     * @notice Returns the maximal rental duration for specific Integration.
     * @param integrationAddress The address of Integration.
     * @return maxDuration Maximal integration time in seconds.
     */
    function getMaxRentalDuration(address integrationAddress) external view returns (uint32 maxDuration);
}
