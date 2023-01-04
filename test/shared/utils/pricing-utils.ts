import { BASE_TOKEN_DECIMALS, HUNDRED_PERCENT, HUNDRED_PERCENT_PRECISION_4 } from "@iqprotocol/solidity-contracts-nft";
import { BigNumber, BigNumberish, FixedNumber } from "ethers";
import { convertToWei } from "./general-utils";

export const calculateBaseRate = (
  expectedForPeriodFee: string,
  periodInSeconds: number,
  decimals = BASE_TOKEN_DECIMALS,
): string => {
  return FixedNumber.from(expectedForPeriodFee).divUnsafe(FixedNumber.from(periodInSeconds)).round(decimals).toString();
};

export const convertPercentage = (
  percent: BigNumberish,
  hundredPercentWithPrecision: number = HUNDRED_PERCENT_PRECISION_4,
): BigNumberish => {
  return convertToWei(
    FixedNumber.from(percent)
      .mulUnsafe(FixedNumber.from(hundredPercentWithPrecision))
      .divUnsafe(FixedNumber.from(HUNDRED_PERCENT))
      .floor()
      .toString(),
    0,
  );
};

export const calculateListerBaseFee = (
  baseRate: string,
  rentalPeriodInSeconds: number,
  decimals = BASE_TOKEN_DECIMALS,
): string => {
  return FixedNumber.from(baseRate).mulUnsafe(FixedNumber.from(rentalPeriodInSeconds)).round(decimals).toString();
};

export const calculateListerBaseFeeInWei = (
  baseRate: string,
  rentalPeriodInSeconds: number,
  decimals = BASE_TOKEN_DECIMALS,
): BigNumberish => {
  return convertListerBaseFeeToWei(calculateListerBaseFee(baseRate, rentalPeriodInSeconds, decimals), decimals);
};

export const convertListerBaseFeeToWei = (listerBaseFee: string, decimals = BASE_TOKEN_DECIMALS): BigNumberish => {
  return convertToWei(listerBaseFee, decimals);
};

export const calculateTaxFeeForFixedRateInWei = (
  listerBaseFee: string,
  baseTaxRate: string,
  decimals = BASE_TOKEN_DECIMALS,
): BigNumberish => {
  return convertToWei(
    FixedNumber.from(listerBaseFee)
      .mulUnsafe(FixedNumber.from(baseTaxRate).divUnsafe(FixedNumber.from(HUNDRED_PERCENT)))
      .round(decimals)
      .toString(),
    decimals,
  );
};
