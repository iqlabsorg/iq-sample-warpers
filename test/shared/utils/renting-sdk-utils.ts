import { BigNumberish } from 'ethers';
import { AccountId, AddressTranslator, RentingEstimationParams } from '@iqprotocol/iq-space-sdk-js';
import { IListingTermsRegistry } from '@iqprotocol/iq-space-protocol/typechain';

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
  warper: AddressTranslator.createAssetType(new AccountId({ chainId, address: warperAddress }), 'erc721'),
  renter: new AccountId({ chainId, address: renterAddress }),
  rentalPeriod,
  paymentToken: AddressTranslator.createAssetType(new AccountId({ chainId, address: paymentTokenAddress }), 'erc20'),
  listingTermsId,
  selectedConfiguratorListingTerms: selectedConfiguratorListingTerms ?? undefined,
});
