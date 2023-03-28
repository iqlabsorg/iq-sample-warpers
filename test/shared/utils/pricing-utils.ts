import { BASE_TOKEN_DECIMALS, convertToWei } from '@iqprotocol/iq-space-sdk-js';
import { BigNumberish, FixedNumber } from 'ethers';

export const calculateListerBaseFee = (
  baseRate: string,
  rentalPeriodInSeconds: BigNumberish,
  decimals = BASE_TOKEN_DECIMALS,
): string => {
  return FixedNumber.from(baseRate).mulUnsafe(FixedNumber.from(rentalPeriodInSeconds)).round(decimals).toString();
};

export const convertListerBaseFeeToWei = (listerBaseFee: string, decimals = BASE_TOKEN_DECIMALS): BigNumberish => {
  return convertToWei(listerBaseFee, decimals);
};
