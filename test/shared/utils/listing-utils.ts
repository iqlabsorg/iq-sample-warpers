import { ADDRESS_ZERO } from "@iqprotocol/solidity-contracts-nft";
import { BigNumberish, BytesLike } from "ethers";
import { BASE_TOKEN_DECIMALS, LISTING_STRATEGY_IDS } from "../../../src/constants";
import { defaultAbiCoder } from "ethers/lib/utils";
import { convertToWei } from "./general-utils";
import { convertPercentage } from "./pricing-utils";
import { ListingParams } from "@iqprotocol/iq-space-sdk-js";
import { toAccountId } from "./sdk-utils";
import { IListingTermsRegistry } from "@iqprotocol/solidity-contracts-nft/typechain";

export const makeListingParams = (
  chainId: string,
  listerAddress: string,
  configuratorAddress: string = ADDRESS_ZERO,
): ListingParams => ({
  lister: toAccountId(chainId, listerAddress),
  configurator: toAccountId(chainId, configuratorAddress),
});
