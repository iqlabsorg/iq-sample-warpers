// SPDX-License-Identifier: MIT
// solhint-disable private-vars-leading-underscore
pragma solidity 0.8.15;

/// @dev Mock of Metahub's treasury address getter.
/// getTreasuryAddress() returns an address Protocol's treasury address for tournament rewards
contract MockMetahub {
    address internal _treasuryAddress;

    /// @dev Constructor for the Mock Metahub contract.
    /// @param treasuryAddress Protocol's treasury address for tournament rewards
    constructor(address treasuryAddress) {
        _treasuryAddress = treasuryAddress;
    }

    /// @dev Getter for Mock Metahub treasury address
    /// @return Protocol's treasury address for tournament rewards
    function getTreasuryAddress() external view returns (address) {
        return _treasuryAddress;
    }
}
