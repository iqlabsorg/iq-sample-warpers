// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../IFeatureController.sol";

interface IRentalPeriod is IFeatureController {
    /**
     * @notice Sets the rental period for an integration.
     * @param integrationAddress Address of the integration.
     * @param startTime Rental period start as a UNIX timestamp.
     * @param endTime Rental period end as a UNIX timestamp.
     */
    function setRentalPeriod(
        address integrationAddress,
        uint256 startTime,
        uint256 endTime
    ) external;

    /**
     * @notice Updates the rental period start for a specific integration.
     * @param integrationAddress Address of the integration.
     * @param newStartTime New rental period start as a UNIX timestamp.
     */
    function setRentalStart(address integrationAddress, uint256 newStartTime) external;

    /**
     * @notice Updates the rental period end for a specific integration.
     * @param integrationAddress Address of the integration.
     * @param newEndTime New rental period end as a UNIX timestamp.
     */
    function setRentalEnd(address integrationAddress, uint256 newEndTime) external;

    /**
     * @notice Retrieves the rental period for an integration.
     * @param integrationAddress Address of the integration.
     * @return startTime Rental period start as a UNIX timestamp.
     * @return endTime Rental period end as a UNIX timestamp.
     */
    function getRentalPeriod(address integrationAddress) external view returns (
        uint256 startTime,
        uint256 endTime
    );
}