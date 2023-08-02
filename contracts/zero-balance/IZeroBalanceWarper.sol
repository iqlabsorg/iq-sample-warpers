// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../external-reward/IExternalRewardWarper.sol";

interface IZeroBalanceWarper is IExternalRewardWarper {
    /**
     * @dev Emits when zero balance addresses are set.
     * @param zeroBalanceAddresses Zero balance addresses.
     */
    event ZeroBalanceAddressesSet(address[] zeroBalanceAddresses);

    /**
     * @dev Sets an array of addresses that need to be checked for zero balance.
     * @param zeroBalanceAddresses Zero balance addresses.
     */
    function setZeroBalanceAddresses(address[] memory zeroBalanceAddresses) external;

    /**
     * @dev Returns an array of addresses that need to be checked for zero balance.
     * @return Zero balance addresses.
     */
    function getZeroBalanceAddresses() external view returns (address[] memory);
}
