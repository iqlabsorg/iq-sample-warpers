import { BigNumberish } from "ethers";
import { IListingTermsRegistry, Rentings } from "@iqprotocol/solidity-contracts-nft/typechain";
import { EMPTY_BYTES4_DATA_HEX, EMPTY_BYTES_DATA_HEX } from "@iqprotocol/solidity-contracts-nft";
import { RentingEstimationParams } from "@iqprotocol/iq-space-sdk-js";
import { createAssetReferenceForSDK, toAccountId } from "./sdk-utils";

export const makeRentingParams = (
  listingId: BigNumberish,
  warperAddress: string,
  renterAddress: string,
  rentalPeriod: BigNumberish,
  paymentTokenAddress: string,
  listingTermsId: BigNumberish,
  selectedConfiguratorListingTerms?: IListingTermsRegistry.ListingTermsStruct,
): Rentings.ParamsStruct => {
  return {
    listingId: listingId,
    warper: warperAddress,
    renter: renterAddress,
    rentalPeriod: rentalPeriod,
    paymentToken: paymentTokenAddress,
    listingTermsId: listingTermsId,
    selectedConfiguratorListingTerms: selectedConfiguratorListingTerms ?? {
      strategyId: EMPTY_BYTES4_DATA_HEX,
      strategyData: EMPTY_BYTES_DATA_HEX,
    },
  };
};

export const makeSDKRentingEstimationParamsERC721 = (
  chainId: string,
  listingId: BigNumberish,
  warperAddress: string,
  renterAddress: string,
  rentalPeriod: BigNumberish,
  paymentTokenAddress: string,
  listingTermsId: BigNumberish,
  selectedConfiguratorListingTerms?: IListingTermsRegistry.ListingTermsStruct,
): RentingEstimationParams => ({
  listingId,
  warper: createAssetReferenceForSDK(chainId, "erc721", warperAddress),
  renter: toAccountId(chainId, renterAddress),
  rentalPeriod,
  paymentToken: createAssetReferenceForSDK(chainId, "erc20", paymentTokenAddress),
  listingTermsId,
  selectedConfiguratorListingTerms: selectedConfiguratorListingTerms ?? {
    strategyId: EMPTY_BYTES4_DATA_HEX,
    strategyData: EMPTY_BYTES_DATA_HEX,
  },
});
