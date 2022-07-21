// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice The implementation contract of Callers Authentication mechanism.
/// Ownable contract dependency used to setup a single owner who is deployer,
/// in order to prevent authorization rights abuse of one authority by another
contract Auth is Ownable {
    /// @notice Reverted if the caller is not authorized.
    error CallerIsNotAuthorized();

    /// @notice Emitted when the authorization status has been set.
    event AuthorizationStatusChanged(address caller, bool status);

    // Participations Mapping from NFT renter to Original NFT to Rental ID
    mapping(address => bool) internal _authorizedCallers;

    /**
     * @dev Modifier to make a function callable only by the authorized callers.
     */
    modifier onlyAuthorizedCaller() {
        if (!isAuthorizedCaller(msg.sender)) revert CallerIsNotAuthorized();
        _;
    }

    /// @notice Updates authorization status for caller.
    /// @notice Can be changed only by Auth contract owner
    /// @param caller The caller address.
    /// @param status The caller authorization status.
    function setAuthorizationStatus(address caller, bool status)
        external
        onlyOwner
    {
        // Setting status for the caller
        // true = authorized
        // false = not authorized
        _authorizedCallers[caller] = status;

        emit AuthorizationStatusChanged(caller, status);
    }

    /// @notice Retrieve authorization status for caller.
    /// @param caller The caller address.
    /// @return Authorization status.
    function isAuthorizedCaller(address caller) public view returns (bool) {
        return _authorizedCallers[caller];
    }
}
