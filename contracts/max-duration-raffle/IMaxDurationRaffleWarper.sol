// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IMaxDurationRaffleWarper {
    function getRentersCount() external view returns (uint256);

    function getTotalRentalDurations(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory renterAddresses, uint256[] memory totalRentalDurations);
}
