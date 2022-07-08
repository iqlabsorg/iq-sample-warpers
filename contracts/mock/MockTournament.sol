// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "../tournament/Tournament.sol";

/// @title Tournament contract for implementing Tournament related ERC20 Reward Warper logic.
contract MockTournament is Tournament {
    /// @dev Mocked external version of _setAllocations() for test purposes
    function setAllocations(
        uint256 rentalId,
        uint16 protocolAllocation,
        uint16 universeAllocation,
        uint16 listerAllocation,
        address lister,
        address renter
    ) external {
        _setAllocations(
            rentalId,
            protocolAllocation,
            universeAllocation,
            listerAllocation,
            lister,
            renter
        );
    }

    /// @dev Mocked external version of _setRentalForToken() for test purposes
    function setRentalForToken(
        address renter,
        uint256 tokenId,
        uint256 rentalId
    ) external {
        _setRentalForToken(renter, tokenId, rentalId);
    }

    /// @dev Mocked external version of _registerForTournament() for test purposes
    function registerForTournament(
        uint256 tournamentId,
        address participant,
        uint256 tokenId
    ) external {
        _registerForTournament(tournamentId, participant, tokenId);
    }
}
