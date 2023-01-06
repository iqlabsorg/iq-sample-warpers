import { AccountId, Asset, AssetId, AssetType } from "@iqprotocol/iq-space-sdk-js";
import { BigNumberish } from "ethers";

export const toAccountId = (chainId: string, address: string): AccountId => {
  return new AccountId({ chainId, address });
};


export const makeERC721AssetForSDK = (chainId: string, token: string, tokenId: number, value: BigNumberish = 1): Asset => {
  return {
    id: toAssetId(chainId, token, tokenId),
    value,
  };
};

const toAssetId = (chainId: string, collectionAddress: string, tokenId: number): AssetId => {
  return new AssetId(`${chainId}/erc721:${collectionAddress}/${tokenId}`);
};

export const createAssetReferenceForSDK = (chainId: string, namespace: 'erc721' | 'erc20', address: string): AssetType => {
  return new AssetType({
    chainId,
    assetName: { namespace, reference: address },
  });
};
