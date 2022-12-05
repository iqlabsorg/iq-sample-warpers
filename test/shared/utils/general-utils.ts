import { ethers } from 'hardhat';
import { BigNumberish, ContractReceipt, ContractTransaction, FixedNumber, Signer } from 'ethers';
import { BASE_TOKEN_DECIMALS, HUNDRED_PERCENT, HUNDRED_PERCENT_PRECISION_4 } from '../../../src/constants';

export type WithTx<T> = Awaited<T> & { tx: ContractTransaction };

export const wait = async (txPromise: Promise<ContractTransaction>): Promise<ContractReceipt> => {
  return (await txPromise).wait();
};

export const randomInteger = (max: number): number => {
  return Math.floor(Math.random() * max);
};

export const randomString = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const mineBlock = async (timestamp = 0): Promise<unknown> => {
  return ethers.provider.send('evm_mine', timestamp > 0 ? [timestamp] : []);
};

export const latestBlockTimestamp = async (): Promise<number> => {
  return (await ethers.provider.getBlock('latest')).timestamp;
};

export const waitBlockchainTime = async (seconds: number): Promise<void> => {
  const time = await latestBlockTimestamp();
  await mineBlock(time + seconds);
};

export const convertToWei = (toConvert: string, decimals: number = BASE_TOKEN_DECIMALS): BigNumberish => {
  return ethers.utils.parseUnits(toConvert, decimals);
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

export interface ActorSet {
  successfulSigner: Signer;
  stranger: Signer;
  requiredRole: string;
}

export class BuilderNotConfiguredError extends Error {
  constructor() {
    super('Builder not properly configured!');
  }
}

export class ContractHelperNotConfiguredError extends Error {
  constructor() {
    super('Contract helper not properly configured!');
  }
}

export class ContractHelperInvalidArgs extends Error {
  constructor() {
    super('Contract helper received wrong arguments!');
  }
}

export type ErrorDataPack = string | BigNumberish;

export const addBracketsMultiple = (error: string, errorData: ErrorDataPack[], isCall = false): string => {
  let result = error + '(';
  for (const data of errorData) {
    if (typeof data === 'string') {
      // string can be also BigNumberish, but not our case for now
      result += isCallQuote(isCall) + data.toString() + isCallQuote(isCall);
    } else {
      result += data.toString();
    }
    result += ', ';
  }
  if (result.endsWith(', ')) {
    result = result.substring(0, result.lastIndexOf(', '));
  }
  return result + ')';
};

export const addBrackets = (error: string, errorData: ErrorDataPack, isCall = false): string =>
  addBracketsMultiple(error, [errorData], isCall);

const isCallQuote = (isCall = false): string => (isCall ? '\\' : '') + '"';
