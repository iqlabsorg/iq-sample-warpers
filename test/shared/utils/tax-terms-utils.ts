import { BytesLike } from "ethers";
import {
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
  TAX_STRATEGY_IDS
} from "@iqprotocol/iq-space-sdk-js";
import { ITaxTermsRegistry } from "@iqprotocol/solidity-contracts-nft/typechain";
import { convertPercentage } from "./pricing-utils";
import { defaultAbiCoder } from "ethers/lib/utils";

export const makeTaxTerms = (
  strategyId: BytesLike = EMPTY_BYTES4_DATA_HEX,
  strategyData: BytesLike = EMPTY_BYTES_DATA_HEX,
): ITaxTermsRegistry.TaxTermsStruct => ({
  strategyId,
  strategyData,
});

export const makeTaxTermsFixedRate = (baseTaxRate: string): ITaxTermsRegistry.TaxTermsStruct =>
  makeTaxTerms(TAX_STRATEGY_IDS.FIXED_RATE_TAX, encodeFixedRateTaxTerms(baseTaxRate));

export const encodeFixedRateTaxTerms = (baseTaxRate: string): BytesLike =>
  defaultAbiCoder.encode(['uint16'], [convertPercentage(baseTaxRate)]);

export const makeTaxTermsFixedRateWithReward = (
  baseTaxRatePercent: string,
  rewardTaxRatePercent: string,
): ITaxTermsRegistry.TaxTermsStruct =>
  makeTaxTerms(
    TAX_STRATEGY_IDS.FIXED_RATE_TAX_WITH_REWARD,
    encodeFixedRateWithRewardTaxTerms(baseTaxRatePercent, rewardTaxRatePercent),
  );

export const encodeFixedRateWithRewardTaxTerms = (
  baseTaxRatePercent: string,
  rewardTaxRatePercent: string,
): BytesLike =>
  defaultAbiCoder.encode(
    ['uint16', 'uint16'],
    [convertPercentage(baseTaxRatePercent), convertPercentage(rewardTaxRatePercent)],
  );
