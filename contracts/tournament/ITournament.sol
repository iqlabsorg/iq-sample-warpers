// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

/// @notice The interface for Tournament contract.
interface ITournament {
    /// @dev Retrieve allocation data for the specific rental ID.
    /// @param rentalId The rental ID.
    /// @return protocolAllocation The reward allocation percentage for protocol.
    /// @return universeAllocation The reward allocation percentage for universe.
    /// @return listerAllocation The reward allocation percentage for lister.
    /// @return lister The address of NFT lister.
    /// @return renter The address of NFT renter.
    function getAllocations(uint256 rentalId)
        external
        view
        returns (
            uint16 protocolAllocation,
            uint16 universeAllocation,
            uint16 listerAllocation,
            address lister,
            address renter
        );

    /// @dev Retrieve tournament registration of token ID for certain tournament by some participant.
    /// @param tournamentId The tournament ID.
    /// @param participant Participant address.
    /// @return Token ID of participating asset.
    function getTournamentRegistration(
        uint256 tournamentId,
        address participant
    ) external view returns (uint256);

    /// @dev Retrieve rental ID by token ID and renter.
    /// @param renter The address of asset renter.
    /// @param tokenId The rented token ID.
    /// @return The rental ID.
    function getRentalForToken(address renter, uint256 tokenId)
        external
        view
        returns (uint256);
}
