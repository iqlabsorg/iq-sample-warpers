import { BASE_TOKEN_DECIMALS, convertToWei, HUNDRED_PERCENT } from '@iqprotocol/iq-space-sdk-js';
import { BigNumberish, FixedNumber } from 'ethers';

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
