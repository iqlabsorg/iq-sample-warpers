// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Interaface for Feature Controllers Contracts.
 * @notice WIP: under development.
 */
interface IFeatureController {

    function execute(address renter, address integrationAddress) external view returns (bool isRentable, string memory errorMessage);

}
