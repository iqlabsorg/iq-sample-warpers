import { BigNumberish, BytesLike } from "ethers";
import { IListingTermsRegistry } from "@iqprotocol/solidity-contracts-nft/typechain";
import { BASE_TOKEN_DECIMALS, LISTING_STRATEGY_IDS } from "../../../src";
import { defaultAbiCoder } from "ethers/lib/utils";
import { convertToWei } from "./general-utils";
import { convertPercentage } from "./pricing-utils";

export const makeListingTerms = (strategyId: BytesLike, strategyData: BytesLike): IListingTermsRegistry.ListingTermsStruct => ({
  strategyId,
  strategyData,
});

export const makeListingTermsFixedRate = (baseRate: BigNumberish, decimals = BASE_TOKEN_DECIMALS): IListingTermsRegistry.ListingTermsStruct =>
  makeListingTerms(LISTING_STRATEGY_IDS.FIXED_RATE, encodeFixedRateListingTerms(baseRate, decimals));

export const encodeFixedRateListingTerms = (baseRate: BigNumberish, decimals = BASE_TOKEN_DECIMALS): BytesLike =>
  defaultAbiCoder.encode(['uint256'], [convertToWei(baseRate.toString(), decimals)]);

export const makeListingTermsFixedRateWithReward = (
  baseRate: BigNumberish,
  rewardRatePercent: string,
  baseRateDecimals = BASE_TOKEN_DECIMALS,
): IListingTermsRegistry.ListingTermsStruct =>
  makeListingTerms(
    LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD,
    encodeFixedRateWithRewardListingTerms(baseRate, rewardRatePercent, baseRateDecimals),
  );

export const encodeFixedRateWithRewardListingTerms = (
  baseRate: BigNumberish,
  rewardRatePercent: string,
  baseRateDecimals = BASE_TOKEN_DECIMALS,
): BytesLike =>
  defaultAbiCoder.encode(
    ['uint256', 'uint16'],
    [convertToWei(baseRate.toString(), baseRateDecimals), convertPercentage(rewardRatePercent)],
  );
