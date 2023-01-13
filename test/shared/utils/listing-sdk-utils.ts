import { ListingParams, ADDRESS_ZERO, AccountId } from "@iqprotocol/iq-space-sdk-js";

export const makeSDKListingParams = (
  chainId: string,
  listerAddress: string,
  configuratorAddress: string = ADDRESS_ZERO,
): ListingParams => ({
  lister: new AccountId({ chainId, address: listerAddress }),
  configurator: new AccountId({ chainId, address: configuratorAddress }),
});
