// SPDX-License-Identifier: MIT
// solhint-disable private-vars-leading-underscore
pragma solidity ^0.8.15;

interface IERC20RewardWarper {
    /// @dev Thrown when invalid parameters are provided when resolving the allocation data.
    error AllocationsNotSet();

    /// @dev Thrown when the participant address does not match the owners address of the token!
    error ParticipantIsNotOwnerOfToken();

    /// @dev Emitted when the universe allocation has been updated.
    event UniverseAllocationSet(uint16 allocation);

    /// @dev Emitted when the protocol allocation has been updated.
    event ProtocolAllocationSet(uint16 allocation);

    /// @dev Emitted when the universe treasury has been updated.
    event UniverseTreasurySet(address treasury);

    /// @dev Emitted when the reward pool address has been set.
    event RewardPoolSet(address pool);

    /// @dev Emitted when new allocation has been set for a token.
    event AllocationsSet(uint256 rentalId, uint256 tokenId, CachedAllocation allocation);

    /// @dev Emitted when a user has joined the tournament.
    event JoinedTournament(uint256 tournamentId, address participant, uint256 tokenId, uint256 rentalId);

    /// @dev Cached allocation structure.
    /// @param protocolAllocation Reward percentage allocation for protocol.
    /// @param universeAllocation Reward percentage allocation for universe.
    /// @param listerAllocation Reward percentage allocation for lister.
    /// @param lister Address of NFT lister.
    /// @param renter Address of NFT renter.
    struct CachedAllocation {
        uint16 protocolAllocation;
        uint16 universeAllocation;
        uint16 listerAllocation;
        address lister;
        address renter;
    }

    /// @notice Executes tournament reward distribution logic after successful setWinner() execution on TRV contract.
    /// @param tournamentId represents the tournament id.
    /// @param reward The reward amount.
    /// @param tokenId The token id.
    /// @param participant The address of the player.
    /// @param rewardToken The reward IERC20 token contract address.
    function disperseRewards(
        uint256 tournamentId,
        uint256 tokenId,
        uint256 reward,
        address participant,
        address rewardToken
    ) external;

    /// @notice Must be called when a user joins the tournament with a warped asset.
    /// @param tournamentId represents the tournament id.
    /// @param participant The address of the player.
    /// @param tokenId The token id of the warped asset.
    function onJoinTournament(
        uint256 tournamentId,
        address participant,
        uint256 tokenId
    ) external;

    /// @notice Sets the universe allocation.
    function setUniverseAllocation(uint16 allocation) external;

    /// @notice Sets the protocol allocation.
    function setProtocolAllocation(uint16 allocation) external;

    /// @notice Sets the universe treasury.
    function setUniverseTreasury(address treasury) external;

    /// @notice Sets the reward pool.
    function setRewardPool(address pool) external;

    /// @notice Get allocation for a given rental.
    function getAllocation(uint256 rentalId) external view returns (CachedAllocation memory);

    /// @notice Get global universe allocation.
    function getUniverseAllocation() external view returns (uint16);

    /// @notice Get global protocol allocation.
    function getProtocolAllocation() external view returns (uint16);

    /// @notice Get universe treasury.
    function getUniverseTreasury() external view returns (address);

    /// @notice Get the reward pool.
    function getRewardPool() external view returns (address);
}
