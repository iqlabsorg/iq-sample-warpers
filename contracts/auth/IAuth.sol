// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

/**
 * @dev The interface for the Callers Authentication mechanism.
 */
interface IAuth {
    /**
     * @dev Retrieve authorization status for caller.
     * @param caller The caller address.
     * @return Authorization status.
     */
    function isAuthorizedCaller(address caller) external view returns (bool);
}
