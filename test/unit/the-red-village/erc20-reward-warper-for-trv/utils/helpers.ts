import {
  MockAgreementTerms,
  MockAsset,
  MockRentalAgremeent,
  MockListingTerms,
  MockPaymentTokenData,
  MockTaxTerms,
  MockProtocolEarning,
  MockUniverseEarning,
  MockUserEarning,
  MockRentalEarnings,
  EarningType,
} from './types';
import { BigNumber, BigNumberish, BytesLike } from 'ethers';
import { ASSET_CLASS, BASE_TOKEN_DECIMALS, LISTING_STRATEGY_IDS, TAX_STRATEGY_IDS } from '../../../../../src/constants';
import { defaultAbiCoder } from 'ethers/lib/utils';

export const makeRentalAgreement = (
  warpedAssets: Array<MockAsset>,
  universeId: BigNumberish,
  collectionId: BytesLike,
  listingId: BigNumberish,
  renter: string,
  startTime: BigNumberish,
  endTime: BigNumberish,
  agreementTerms: MockAgreementTerms,
): MockRentalAgremeent => ({
  warpedAssets,
  universeId,
  collectionId,
  listingId,
  renter,
  startTime,
  endTime,
  agreementTerms,
});

export const makeAgreementTerms = (
  listingTerms: MockListingTerms,
  universeTaxTerms: MockTaxTerms,
  protocolTaxTerms: MockTaxTerms,
  paymentTokenData: MockPaymentTokenData,
): MockAgreementTerms => ({
  listingTerms,
  universeTaxTerms,
  protocolTaxTerms,
  paymentTokenData,
});

export const makeUserEarning = (
  earningType: EarningType,
  isLister: boolean,
  account: string,
  value: BigNumberish,
  token: string,
): MockUserEarning => ({
  earningType,
  isLister,
  account,
  value,
  token,
});

export const makeUniverseEarning = (
  earningType: EarningType,
  universeId: BigNumberish,
  value: BigNumberish,
  token: string,
): MockUniverseEarning => ({
  earningType,
  universeId,
  value,
  token,
});

export const makeProtocolEarning = (
  earningType: EarningType,
  value: BigNumberish,
  token: string,
): MockProtocolEarning => ({
  earningType,
  value,
  token,
});

export const makeRentalEarnings = (
  userEarnings: Array<MockUserEarning>,
  universeEarning: MockUniverseEarning,
  protocolEarning: MockProtocolEarning,
): MockRentalEarnings => ({
  userEarnings,
  universeEarning,
  protocolEarning,
});

export const makePaymentTokenData = (paymentToken: string, paymentTokenQuote: BigNumberish): MockPaymentTokenData => ({
  paymentToken,
  paymentTokenQuote,
});

// export const makeListingTermsFixedRate = (baseRate: BigNumberish, decimals = BASE_TOKEN_DECIMALS): MockListingTerms =>
//   makeListingTerms(LISTING_STRATEGY_IDS.FIXED_RATE, encodeFixedRateListingTerms(baseRate, decimals));

// export const encodeFixedRateListingTerms = (baseRate: BigNumberish, decimals = BASE_TOKEN_DECIMALS): BytesLike =>
//   defaultAbiCoder.encode(['uint256'], [convertToWei(baseRate.toString(), decimals)]);

// export const makeListingTermsFixedRateWithReward = (
//   baseRate: BigNumberish,
//   rewardRatePercent: string,
//   baseRateDecimals = BASE_TOKEN_DECIMALS,
// ): MockListingTerms =>
//   makeListingTerms(
//     LISTING_STRATEGY_IDS.FIXED_RATE_WITH_REWARD,
//     encodeFixedRateWithRewardListingTerms(baseRate, rewardRatePercent, baseRateDecimals),
//   );

// export const encodeFixedRateWithRewardListingTerms = (
//   baseRate: BigNumberish,
//   rewardRatePercent: string,
//   baseRateDecimals = BASE_TOKEN_DECIMALS,
// ): BytesLike =>
//   defaultAbiCoder.encode(
//     ['uint256', 'uint16'],
//     [convertToWei(baseRate.toString(), baseRateDecimals), convertPercentage(rewardRatePercent)],
//   );

// export const makeTaxTermsFixedRate = (baseTaxRate: string): MockTaxTerms =>
//   makeTaxTerms(TAX_STRATEGY_IDS.FIXED_RATE_TAX, encodeFixedRateTaxTerms(baseTaxRate));
//
// export const encodeFixedRateTaxTerms = (baseTaxRate: string): BytesLike =>
//   defaultAbiCoder.encode(['uint16'], [convertPercentage(baseTaxRate)]);

// export const makeTaxTermsFixedRateWithReward = (
//   baseTaxRatePercent: string,
//   rewardTaxRatePercent: string,
// ): MockTaxTerms =>
//   makeTaxTerms(
//     TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
//     encodeFixedRateWithRewardTaxTerms(baseTaxRatePercent, rewardTaxRatePercent),
//   );
//
// export const encodeFixedRateWithRewardTaxTerms = (
//   baseTaxRatePercent: string,
//   rewardTaxRatePercent: string,
// ): BytesLike =>
//   defaultAbiCoder.encode(
//     ['uint16', 'uint16'],
//     [convertPercentage(baseTaxRatePercent), convertPercentage(rewardTaxRatePercent)],
//   );

// export const makeListingTerms = (strategyId: BytesLike, strategyData: BytesLike): MockListingTerms => ({
//   strategyId,
//   strategyData,
// });

// export const makeTaxTerms = (strategyId: BytesLike, strategyData: BytesLike): MockTaxTerms => ({
//   strategyId,
//   strategyData,
// });

export const makeERC721Asset = (token: string, tokenId: BigNumberish, value: BigNumberish = 1): MockAsset => {
  return makeAsset(ASSET_CLASS.ERC721, defaultAbiCoder.encode(['address', 'uint256'], [token, tokenId]), value);
};

export const makeAsset = (assetClass: BytesLike, data: BytesLike, value: BigNumberish): MockAsset => {
  return {
    id: { class: assetClass, data },
    value: BigNumber.from(value),
  };
};
