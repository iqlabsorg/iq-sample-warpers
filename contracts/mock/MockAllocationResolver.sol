// SPDX-License-Identifier: MIT
// solhint-disable private-vars-leading-underscore
pragma solidity 0.8.15;

/// @notice Mock of desired interface between ListingController and Warper
/// For accessing ListingStrategy overrides data
contract MockAllocationResolver {
    /// @dev Duplication Allocation struct for mock purposes.
    /// NOTE In production this data would be collected by Allocation Resolver Contract
    /// @param protocolAllocation Reward percentage allocation for protocol.
    /// @param universeAllocation Reward percentage allocation for universe.
    /// @param listerAllocation Reward percentage allocation for lister.
    struct Allocation {
        uint16 protocolAllocation;
        uint16 universeAllocation;
        uint16 listerAllocation;
        bool defined;
    }

    /// @dev Duplicated Allocations mapping storage for mock purposes
    /// Allocations Mapping from rental ID to the allocation info.
    mapping(uint256 => Allocation) internal _allocations;

    /// @dev Registers mock allocation for the specific rental ID.
    /// @param rentalId The rental ID.
    /// @param protocolAllocation The reward allocation percentage for protocol.
    /// @param universeAllocation The reward allocation percentage for universe.
    /// @param listerAllocation The reward allocation percentage for lister.
    function setAllocations(
        uint256 rentalId,
        uint16 protocolAllocation,
        uint16 universeAllocation,
        uint16 listerAllocation
    ) external {
        // Creating mock allocation record
        Allocation memory allocation = Allocation({
            protocolAllocation: protocolAllocation,
            universeAllocation: universeAllocation,
            listerAllocation: listerAllocation,
            defined: true
        });
        // Binding it to specific rental ID
        _allocations[rentalId] = allocation;
    }

    /// @dev Retrieve mock allocation data for the specific rental ID.
    /// @param rentalId The rental ID.
    /// @return protocolAllocation The reward allocation percentage for protocol.
    /// @return universeAllocation The reward allocation percentage for universe.
    /// @return listerAllocation The reward allocation percentage for lister.
    function getAllocations(uint256 rentalId)
        external
        view
        returns (
            uint16 protocolAllocation,
            uint16 universeAllocation,
            uint16 listerAllocation
        )
    {
        if (_allocations[rentalId].defined != true) revert();

        protocolAllocation = _allocations[rentalId].protocolAllocation;
        universeAllocation = _allocations[rentalId].universeAllocation;
        listerAllocation = _allocations[rentalId].listerAllocation;
    }
}
