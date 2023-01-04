import { AccountId } from "@iqprotocol/iq-space-sdk-js";

export const toAccountId = (chainId: string, address: string): AccountId => {
  return new AccountId({ chainId, address });
};
