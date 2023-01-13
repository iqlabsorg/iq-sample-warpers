import { BigNumberish } from "ethers";
import {
  AccountId,
  AddressTranslator,
  ListingTerms,
  RentingEstimationParams,
} from "@iqprotocol/iq-space-sdk-js";

export const makeSDKRentingEstimationParamsERC721 = (
  chainId: string,
  listingId: BigNumberish,
  warperAddress: string,
  renterAddress: string,
  rentalPeriod: BigNumberish,
  paymentTokenAddress: string,
  listingTermsId: BigNumberish,
  selectedConfiguratorListingTerms?: ListingTerms,
): RentingEstimationParams => ({
  listingId,
  warper: AddressTranslator.createAssetType(new AccountId({chainId, address: warperAddress}), 'erc721'),
  renter: new AccountId({ chainId, address: renterAddress }),
  rentalPeriod,
  paymentToken: AddressTranslator.createAssetType(new AccountId({chainId, address: paymentTokenAddress}), 'erc20'),
  listingTermsId,
  selectedConfiguratorListingTerms: selectedConfiguratorListingTerms ?? undefined,
});
