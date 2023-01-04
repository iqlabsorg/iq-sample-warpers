import { ADDRESS_ZERO } from "@iqprotocol/solidity-contracts-nft";
import { Listings } from "@iqprotocol/solidity-contracts-nft/typechain/contracts/listing/listing-manager/IListingManager";
import { BigNumberish, BytesLike } from "ethers";
import { MockListingTerms } from "../../unit/the-red-village/erc20-reward-warper-for-trv/utils/types";
import { BASE_TOKEN_DECIMALS, LISTING_STRATEGY_IDS } from "../../../src/constants";
import { defaultAbiCoder } from "ethers/lib/utils";
import { convertToWei } from "./general-utils";
import { convertPercentage } from "./pricing-utils";
import { ListingParams } from "@iqprotocol/iq-space-sdk-js";
import { toAccountId } from "./sdk-utils";

export const makeListingParams = (
  chainId: string,
  listerAddress: string,
  configuratorAddress: string = ADDRESS_ZERO,
): ListingParams => ({
  lister: toAccountId(chainId, listerAddress),
  configurator: toAccountId(chainId, configuratorAddress),
});

export const makeListingTerms = (strategyId: BytesLike, strategyData: BytesLike): MockListingTerms => ({
  strategyId,
  strategyData,
});

export const makeListingTermsFixedRate = (baseRate: BigNumberish, decimals = BASE_TOKEN_DECIMALS): MockListingTerms =>
  makeListingTerms(LISTING_STRATEGY_IDS.FIXED_RATE, encodeFixedRateListingTerms(baseRate, decimals));

export const encodeFixedRateListingTerms = (baseRate: BigNumberish, decimals = BASE_TOKEN_DECIMALS): BytesLike =>
  defaultAbiCoder.encode(['uint256'], [convertToWei(baseRate.toString(), decimals)]);

export const makeListingTermsFixedRateWithReward = (
  baseRate: BigNumberish,
  rewardRatePercent: string,
  baseRateDecimals = BASE_TOKEN_DECIMALS,
): MockListingTerms =>
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
