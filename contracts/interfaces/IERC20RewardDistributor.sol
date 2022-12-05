// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../mocks/IQProtocolStructsMock.sol";

interface IERC20RewardDistributor {
    /**
     * @dev Thrown when the Warper has not set enough allowance for ERC20RewardDistributor.
     */
    error InsufficientAllowanceForDistribution(uint256 asked, uint256 provided);

    /**
     * @dev External ERC20 Reward Fees coming from outside of protocol as a reward.
     * @param token Address of reward token.
     * @param totalReward Total amount of reward tokens.
     * @param listerRewardFee Lister's part of reward tokens.
     * @param renterRewardFee Renter's part of reward tokens.
     * @param universeRewardFee Universe's part of reward tokens.
     * @param protocolRewardFee Protocol's part of reward tokens.
     */
    struct RentalExternalERC20RewardFees {
        address token;
        uint256 totalReward;
        uint256 listerRewardFee;
        uint256 renterRewardFee;
        uint256 universeRewardFee;
        uint256 protocolRewardFee;
    }

    /**
     * @notice Executes a single distribution of external ERC20 reward.
     * @dev Before calling this function, an ERC20 increase allowance should be given
     *  for the `tokenAmount` of `token`
     *  by caller for Metahub.
     * @param listingId The ID of related to the distribution Listing.
     * @param agreementId The ID of related to the distribution Rental Agreement.
     * @param token Represents the ERC20 token that is being distributed.
     * @param rewardAmount Represents the `token` amount to be distributed as a reward.
     * @return rentalExternalRewardEarnings Represents external reward based earnings for all entities.
     */
    function distributeExternalReward(
        uint256 listingId,
        uint256 agreementId,
        address token,
        uint256 rewardAmount
    ) external returns (IQProtocolStructsMock.RentalEarnings memory rentalExternalRewardEarnings);
}
