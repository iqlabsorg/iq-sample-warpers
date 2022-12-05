import { BigNumberish, BytesLike } from 'ethers';

export interface MockListingTerms {
  strategyId: BytesLike;
  strategyData: BytesLike;
}

export interface MockTaxTerms {
  strategyId: BytesLike;
  strategyData: BytesLike;
}

export interface MockPaymentTokenData {
  paymentToken: string;
  paymentTokenQuote: BigNumberish;
}

export interface MockAssetId {
  class: BytesLike;
  data: BytesLike;
}

export interface MockAsset {
  id: MockAssetId;
  value: BigNumberish;
}

export interface MockAgreementTerms {
  listingTerms: MockListingTerms;
  universeTaxTerms: MockTaxTerms;
  protocolTaxTerms: MockTaxTerms;
  paymentTokenData: MockPaymentTokenData;
}

export interface MockRentalAgremeent {
  warpedAssets: MockAsset[];
  universeId: BigNumberish;
  collectionId: BytesLike;
  listingId: BigNumberish;
  renter: string;
  startTime: BigNumberish;
  endTime: BigNumberish;
  agreementTerms: MockAgreementTerms;
}

export enum EarningType {
  LISTER_FIXED_FEE,
  LISTER_EXTERNAL_ERC20_REWARD,
  RENTER_EXTERNAL_ERC20_REWARD,
  UNIVERSE_FIXED_FEE,
  UNIVERSE_EXTERNAL_ERC20_REWARD,
  PROTOCOL_FIXED_FEE,
  PROTOCOL_EXTERNAL_ERC20_REWARD,
}

export interface MockUserEarning {
  earningType: EarningType;
  isLister: boolean;
  account: string;
  value: BigNumberish;
  token: string;
}

export interface MockUniverseEarning {
  earningType: EarningType;
  universeId: BigNumberish;
  value: BigNumberish;
  token: string;
}

export interface MockProtocolEarning {
  earningType: EarningType;
  value: BigNumberish;
  token: string;
}

export interface MockRentalEarnings {
  userEarnings: Array<MockUserEarning>;
  universeEarning: MockUniverseEarning;
  protocolEarning: MockProtocolEarning;
}
