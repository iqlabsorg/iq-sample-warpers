// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "./ITournament.sol";

/// @title Tournament contract for implementing Tournament related ERC20 Reward Warper logic.
contract Tournament is ITournament {
    /// @dev Thrown when the allocation for rental ID is not defined
    error AllocationNotDefined();

    /// @dev Thrown no rental was not set for participant renting token with certain ID
    error RentalDoesNotExists();

    /// @dev Thrown when the token ID is not registered for certain tournament
    /// by certain participant
    error TokenIsNotRegisteredForTournament();

    /// @dev Allocation structure.
    /// @param protocolAllocation Reward percentage allocation for protocol.
    /// @param universeAllocation Reward percentage allocation for universe.
    /// @param listerAllocation Reward percentage allocation for lister.
    /// @param lister Address of NFT lister.
    /// @param renter Address of NFT renter.
    /// @param defined Indicates whether the allocation is defined.
    struct Allocation {
        uint16 protocolAllocation;
        uint16 universeAllocation;
        uint16 listerAllocation;
        address lister;
        address renter;
        bool defined;
    }

    /// @dev Registration structure.
    /// @param tokenId Token ID of NFT registered for tournament.
    /// @param registered Indicates whether the registration is defined.
    struct Registration {
        uint256 tokenId;
        bool registered;
    }

    /// @dev Allocations Mapping from rental ID to the allocation info.
    mapping(uint256 => Allocation) internal _allocations;

    /// @dev Participations Mapping from NFT renter to Original NFT to Rental ID
    mapping(address => mapping(uint256 => uint256)) internal _tokenRentals;

    /// @dev Registrations for tournament Mapping from tournament ID to
    // tournament participant to registration info
    mapping(uint256 => mapping(address => Registration))
        internal _tournamentRegistrations;

    modifier onlyExistingRentalId(uint256 rentalId) {
        require(rentalId > 0);
        _;
    }

    /// @inheritdoc ITournament
    function getAllocations(uint256 rentalId)
        public
        view
        returns (
            uint16 protocolAllocation,
            uint16 universeAllocation,
            uint16 listerAllocation,
            address lister,
            address renter
        )
    {
        if (_allocations[rentalId].defined != true)
            revert AllocationNotDefined();

        protocolAllocation = _allocations[rentalId].protocolAllocation;
        universeAllocation = _allocations[rentalId].universeAllocation;
        listerAllocation = _allocations[rentalId].listerAllocation;
        lister = _allocations[rentalId].lister;
        renter = _allocations[rentalId].renter;
    }

    /// @inheritdoc ITournament
    function getRentalForToken(address renter, uint256 tokenId)
        public
        view
        returns (uint256)
    {
        // Check that there is possibility to register participant with token ID,
        // By default rental ID always bigger than 0
        if (_tokenRentals[renter][tokenId] == 0) revert RentalDoesNotExists();
        return _tokenRentals[renter][tokenId];
    }

    /// @inheritdoc ITournament
    function getTournamentRegistration(
        uint256 tournamentId,
        address participant
    ) public view returns (uint256) {
        if (
            _tournamentRegistrations[tournamentId][participant].registered !=
            true
        ) {
            revert TokenIsNotRegisteredForTournament();
        }
        return _tournamentRegistrations[tournamentId][participant].tokenId;
    }

    /// @dev Registers new allocation for specific rental.
    /// @param rentalId The rental ID.
    /// @param protocolAllocation The reward allocation percentage for protocol.
    /// @param universeAllocation The reward allocation percentage for universe.
    /// @param listerAllocation The reward allocation percentage for lister.
    /// @param lister The address of NFT lister.
    /// @param renter The address of NFT renter.
    function _setAllocations(
        uint256 rentalId,
        uint16 protocolAllocation,
        uint16 universeAllocation,
        uint16 listerAllocation,
        address lister,
        address renter
    ) internal {
        // Structuring allocations and addresses required for reward distribution
        Allocation memory allocation = Allocation({
            protocolAllocation: protocolAllocation,
            universeAllocation: universeAllocation,
            listerAllocation: listerAllocation,
            lister: lister,
            renter: renter,
            defined: true
        });
        // Binding allocation structure to rental ID
        _allocations[rentalId] = allocation;
    }

    /// @dev Registers rental ID for certain token ID rented by renter.
    /// @param renter The address of asset renter.
    /// @param tokenId The rented token ID.
    /// @param rentalId The rental ID.
    function _setRentalForToken(
        address renter,
        uint256 tokenId,
        uint256 rentalId
    ) internal {
        // Check that rental ID has registered allocation data
        if (_allocations[rentalId].defined != true)
            revert AllocationNotDefined();
        // Registering that renter has rented champion with certain ID (token ID)
        // and rental record statement has its unique ID (rental ID)
        _tokenRentals[renter][tokenId] = rentalId;
    }

    /// @dev Registers participant for certain tournament.
    /// @param tournamentId The tournament ID.
    /// @param participant The address of tournament participant.
    /// @param tokenId The participating asset token ID.
    function _registerForTournament(
        uint256 tournamentId,
        address participant,
        uint256 tokenId
    ) internal {
        // Check that there is possibility to register participant with token ID,
        // By default rental ID always bigger than 0
        if (_tokenRentals[participant][tokenId] == 0)
            revert RentalDoesNotExists();
        // Registering participant for tournament with certain champion ID (token ID)
        _tournamentRegistrations[tournamentId][participant] = Registration({
            tokenId: tokenId,
            registered: true
        });
    }
}
