import { ListingParams, ADDRESS_ZERO } from "@iqprotocol/iq-space-sdk-js";
import { toAccountId } from "./sdk-utils";

export const makeListingParams = (
  chainId: string,
  listerAddress: string,
  configuratorAddress: string = ADDRESS_ZERO,
): ListingParams => ({
  lister: toAccountId(chainId, listerAddress),
  configurator: toAccountId(chainId, configuratorAddress),
});
