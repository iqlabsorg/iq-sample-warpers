/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import hre, { getChainId } from 'hardhat';
import { Auth, ERC20RewardWarperForTRV } from '../../../../typechain';
import {
  ERC20Mock,
  ERC721Mock,
  IListingManager,
  IListingTermsRegistry, IListingWizardV1,
  IMetahub, IRentingManager, ITaxTermsRegistry, IUniverseRegistry, IUniverseWizardV1, IWarperWizardV1
} from '@iqprotocol/solidity-contracts-nft/typechain';
import { ChainId } from "@iqprotocol/iq-space-sdk-js";

export async function unitFixtureERC20RewardWarper(): Promise<{
  contractsInfra: any;
  baseToken: ERC20Mock;
  originalCollection: ERC721Mock;
  erc20RewardWarperForTRV: ERC20RewardWarperForTRV;
  rewardToken: ERC20Mock;
}> {
  const baseToken = (await hre.run('deploy:test:mock:erc20', {
    name: 'Test ERC20',
    symbol: 'ONFT',
    decimals: 18,
    totalSupply: 100_000_000,
  })) as ERC20Mock;

  const contractsInfra = await hre.run('deploy:initial-deployment', {
    baseToken: baseToken.address,
    rentalFee: 100,
    unsafe: true
  });

  const originalCollection = (await hre.run('deploy:test:mock:erc721', {
    name: 'Test ERC721',
    symbol: 'ONFT',
  })) as ERC721Mock;

  const rewardToken = (await hre.run('deploy:test:mock:erc20', {
    name: 'Reward Token',
    symbol: 'RWRD',
  })) as ERC20Mock;

  const erc20RewardWarperForTRV = (await hre.run('deploy:erc20-reward-warper-for-trv', {
    original: originalCollection.address,
    metahub: contractsInfra.metahub.address,
  })) as ERC20RewardWarperForTRV;

  return {
    contractsInfra,
    baseToken,
    originalCollection,
    erc20RewardWarperForTRV,
    rewardToken,
  };
}
