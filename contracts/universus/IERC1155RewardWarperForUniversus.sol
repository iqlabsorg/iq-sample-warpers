// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/accounting/Accounts.sol";

interface IERC1155RewardWarperForUniversus {
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
        uint64 universusId,
        uint256 championId,
        uint256 rentalId,
        address renter,
        address lister
    );

    /**
     * @dev Executes universus reward distribution.
     * The reward pool must set allowance for this Warper equal to `rewardAmount`.
     * @param serviceId represents the Universus service ID.
     * @param universusId represents the universus ID.
     * @param tokenId The token ID.
     * @param rewardAmount The reward tokens amount.
     * @param participant The address of the player.
     * @param rewardTokenAddress The reward IERC1155 token contract address.
     */
    function disperseRewards(
        uint64 serviceId,
        uint64 universusId,
        uint256 tokenId,
        uint256 rewardAmount,
        address participant,
        address rewardTokenAddress
    ) external;

    /**
     * @dev Must be called when a user joins the universus with a warped asset.
     * @param serviceId represents the Universus service ID.
     * @param universusId represents the universus ID.
     * @param participant The address of the player.
     * @param tokenId The token id of the warped asset.
     */
    function onJoinUniversus(
        uint64 serviceId,
        uint64 universusId,
        address participant,
        uint256 tokenId
    ) external;

    /**
     * @dev Must be set, so that rewards can be distributed.
     * @param rewardPool Is the address where the reward funds are taken from.
     */
    function setRewardPool(address rewardPool) external;
}
