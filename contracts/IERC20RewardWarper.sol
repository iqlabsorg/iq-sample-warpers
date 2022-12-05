// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./mocks/IQProtocolStructsMock.sol";

interface IERC20RewardWarper {
    /**
     * @dev Thrown when the participant does not exist.
     */
    error ParticipantDoesNotExist();

    /**
     * @dev Thrown when the participant address does not match the owners address of the token!
     */
    error ParticipantIsNotOwnerOfToken();

    /**
     * @dev Emitted when a user has joined the tournament.
     */
    event JoinedTournament(
        uint64 serviceId,
        uint64 tournamentId,
        address participant,
        uint256 tokenId,
        uint256 rentalId
    );

    event RewardsDistributed(
        uint64 serviceId,
        uint64 tournamentId,
        uint256 tokenId,
        uint256 rewardAmount,
        uint256 rentalId,
        uint256 listingId,
        address participant,
        address rewardTokenAddress,
        IQProtocolStructsMock.RentalEarnings tournamentEarnings
    );

    /**
     * @dev Tournament participant data.
     * @param rentalId Rental agreement ID.
     * @param listingId Listing ID.
     */
    struct TournamentParticipant {
        uint256 rentalId;
        uint256 listingId;
    }

    /**
     * @dev Executes tournament reward distribution logic after successful setWinner() execution on TRV contract.
     * @param serviceId represents the TRV service ID.
     * @param tournamentId represents the tournament ID.
     * @param tokenId The token ID.
     * @param rewardAmount The reward tokens amount.
     * @param participant The address of the player.
     * @param rewardTokenAddress The reward IERC20 token contract address.
     */
    function distributeRewards(
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
}
