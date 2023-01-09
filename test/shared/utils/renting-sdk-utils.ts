import { BigNumberish } from "ethers";
import {
  ListingTermsParams,
  RentingEstimationParams,
} from "@iqprotocol/iq-space-sdk-js";
import { createAssetReferenceForSDK, toAccountId } from "./sdk-utils";

export const makeSDKRentingEstimationParamsERC721 = (
  chainId: string,
  listingId: BigNumberish,
  warperAddress: string,
  renterAddress: string,
  rentalPeriod: BigNumberish,
  paymentTokenAddress: string,
  listingTermsId: BigNumberish,
  selectedConfiguratorListingTerms?: ListingTermsParams,
): RentingEstimationParams => ({
  listingId,
  warper: createAssetReferenceForSDK(chainId, "erc721", warperAddress),
  renter: toAccountId(chainId, renterAddress),
  rentalPeriod,
  paymentToken: createAssetReferenceForSDK(chainId, "erc20", paymentTokenAddress),
  listingTermsId,
  selectedConfiguratorListingTerms: selectedConfiguratorListingTerms ?? undefined,
});
