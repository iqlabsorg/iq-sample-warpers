import { Accounts, Rentings } from "@iqprotocol/solidity-contracts-nft/typechain/contracts/metahub/core/IMetahub";
import { BigNumber, BigNumberish } from "ethers";

export const EARNING_TYPES = {
  LISTER_FIXED_FEE: 0,
  LISTER_EXTERNAL_ERC20_REWARD: 1,
  RENTER_EXTERNAL_ERC20_REWARD: 2,
  UNIVERSE_FIXED_FEE: 3,
  UNIVERSE_EXTERNAL_ERC20_REWARD: 4,
  PROTOCOL_FIXED_FEE: 5,
  PROTOCOL_EXTERNAL_ERC20_REWARD: 6,
};

export const makeUserEarning = (
  earningType: BigNumberish,
  isLister: boolean,
  account: string,
  value: BigNumberish,
  token: string,
): Accounts.UserEarningStruct => ({
  earningType,
  isLister,
  account,
  value,
  token,
});

export const makeUniverseEarning = (
  earningType: BigNumberish,
  universeId: BigNumberish,
  value: BigNumberish,
  token: string,
): Accounts.UniverseEarningStruct => ({
  earningType,
  universeId,
  value,
  token,
});

export const makeProtocolEarning = (
  earningType: BigNumberish,
  value: BigNumberish,
  token: string,
): Accounts.ProtocolEarningStruct => ({
  earningType,
  value,
  token,
});

export const convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution = (
  expectedListerFeeFromRewards: BigNumberish,
  expectedRenterFeeFromRewards: BigNumberish,
  expectedUniverseFeeFromRewards: BigNumberish,
  expectedProtocolFeeFromRewards: BigNumberish,
  paymentTokenAddress: string,
  listerAddress: string,
  renterAddress: string,
  universeId: BigNumberish,
): Accounts.RentalEarningsStruct => {
  return {
    userEarnings: [
      makeUserEarning(
        EARNING_TYPES.LISTER_EXTERNAL_ERC20_REWARD,
        true,
        listerAddress,
        BigNumber.from(expectedListerFeeFromRewards),
        paymentTokenAddress,
      ),
      makeUserEarning(
        EARNING_TYPES.RENTER_EXTERNAL_ERC20_REWARD,
        false,
        renterAddress,
        BigNumber.from(expectedRenterFeeFromRewards),
        paymentTokenAddress,
      ),
    ],
    universeEarning: makeUniverseEarning(
      EARNING_TYPES.UNIVERSE_EXTERNAL_ERC20_REWARD,
      universeId,
      BigNumber.from(expectedUniverseFeeFromRewards),
      paymentTokenAddress,
    ),
    protocolEarning: makeProtocolEarning(
      EARNING_TYPES.PROTOCOL_EXTERNAL_ERC20_REWARD,
      expectedProtocolFeeFromRewards,
      paymentTokenAddress,
    ),
  };
};
