// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../interfaces/IERC20RewardDistributor.sol";

contract ERC20RewardDistributorMock is IERC20RewardDistributor {
    address internal _listingBeneficiary;
    uint256 internal _listingBeneficiaryRewardAmount;
    address internal _renter;
    uint256 internal _renterRewardAmount;
    uint256 internal _universeId;
    uint256 internal _universeRewardAmount;
    uint256 internal _protocolRewardAmount;

    uint256 internal _listingId;
    uint256 internal _agreementId;
    uint256 internal _rewardAmount;

    constructor(
        address listingBeneficiary,
        uint256 listingBeneficiaryRewardAmount,
        address renter,
        uint256 renterRewardAmount,
        uint256 universeId,
        uint256 universeRewardAmount,
        uint256 protocolRewardAmount
    ) {
        _listingBeneficiary = listingBeneficiary;
        _listingBeneficiaryRewardAmount = listingBeneficiaryRewardAmount;
        _renter = renter;
        _renterRewardAmount = renterRewardAmount;
        _universeId = universeId;
        _universeRewardAmount = universeRewardAmount;
        _protocolRewardAmount = protocolRewardAmount;
    }

    /// @inheritdoc IERC20RewardDistributor
    function distributeExternalReward(
        uint256 listingId,
        uint256 agreementId,
        address token,
        uint256 rewardAmount
    ) external returns (IQProtocolStructsMock.RentalEarnings memory rentalExternalRewardEarnings) {
        _listingId = listingId;
        _agreementId = agreementId;
        _rewardAmount = rewardAmount;

        rentalExternalRewardEarnings.userEarnings = new IQProtocolStructsMock.UserEarning[](2);

        rentalExternalRewardEarnings.userEarnings[0] = IQProtocolStructsMock.UserEarning({
            earningType: IQProtocolStructsMock.EarningType.LISTER_EXTERNAL_ERC20_REWARD,
            isLister: true,
            account: _listingBeneficiary,
            value: _listingBeneficiaryRewardAmount,
            token: token
        });

        rentalExternalRewardEarnings.userEarnings[1] = IQProtocolStructsMock.UserEarning({
            earningType: IQProtocolStructsMock.EarningType.RENTER_EXTERNAL_ERC20_REWARD,
            isLister: false,
            account: _renter,
            value: _renterRewardAmount,
            token: token
        });

        rentalExternalRewardEarnings.universeEarning = IQProtocolStructsMock.UniverseEarning({
            earningType: IQProtocolStructsMock.EarningType.UNIVERSE_EXTERNAL_ERC20_REWARD,
            universeId: _universeId,
            value: _universeRewardAmount,
            token: token
        });

        rentalExternalRewardEarnings.protocolEarning = IQProtocolStructsMock.ProtocolEarning({
            earningType: IQProtocolStructsMock.EarningType.PROTOCOL_EXTERNAL_ERC20_REWARD,
            value: _protocolRewardAmount,
            token: token
        });
    }
}
