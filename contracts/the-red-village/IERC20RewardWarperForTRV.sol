// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/accounting/Accounts.sol";

interface IERC20RewardWarperForTRV {
    /**
     * @dev Thrown when the participant does not exist.
     */
    error ParticipantDoesNotExist();

    /**
     * @dev Thrown when the participant address does not match the owners address of the token!
     */
    error ParticipantIsNotOwnerOfToken();

    event RewardsDistributed(
        uint64 serviceId,
        uint64 tournamentId,
        uint256 championId,
        uint256 rentalId,
        address renter,
        address lister
    );

    /**
     * @dev Executes tournament reward distribution.
     * The reward pool must set allowance for this Warper equal to `rewardAmount`.
     * @param serviceId represents the TRV service ID.
     * @param tournamentId represents the tournament ID.
     * @param tokenId The token ID.
     * @param rewardAmount The reward tokens amount.
     * @param participant The address of the player.
     * @param rewardTokenAddress The reward IERC20 token contract address.
     */
    function disperseRewards(
        uint64 serviceId,
        uint64 tournamentId,
        uint256 tokenId,
        uint256 rewardAmount,
        address participant,
        address rewardTokenAddress
    ) external;

    /**
     * @dev Must be called when a user joins the tournament with a warped asset.
     * @param serviceId represents the TRV service ID.
     * @param tournamentId represents the tournament ID.
     * @param participant The address of the player.
     * @param tokenId The token id of the warped asset.
     */
    function onJoinTournament(
        uint64 serviceId,
        uint64 tournamentId,
        address participant,
        uint256 tokenId
    ) external;

    /**
     * @dev Must be set, so that rewards can be distributed.
     * @param rewardPool Is the address where the reward funds are taken from.
     */
    function setRewardPool(address rewardPool) external;
}
