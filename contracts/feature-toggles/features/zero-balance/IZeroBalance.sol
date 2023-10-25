// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../IFeatureController.sol";

interface IZeroBalance is IFeatureController {
    /**
     * @notice Returns the list of zero balance addresses for a given address.
     * @param integrationAddress The address of Integration.
     * @return An array of addresses with zero balance associated with the given integration.
     */
    function getZeroBalanceAddresses(address integrationAddress) external view returns (address[] memory);

    /**
     * @notice Adds a new zero balance address for a given integration.
     * @param integrationAddress The integration address for which the zero balance address needs to be added.
     * @param zeroBalanceAddresses The NFT collection addresses for which the zero balance feature needs to be enabled.
     */
    function setZeroBalanceAddresses(address integrationAddress, address[] memory zeroBalanceAddresses) external;
}