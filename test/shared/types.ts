import { ERC20Mock, ERC721Mock, Metahub } from '@iqprotocol/solidity-contracts-nft/typechain';
import { ERC20RewardWarper, Auth, ContractRegistryMock, ERC20RewardDistributorMock } from '../../typechain';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { FakeContract } from '@defi-wonderland/smock';
import type { Fixture } from 'ethereum-waffle';

declare module 'mocha' {
  interface Context {
    contracts: Contracts;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    mocks: Mocks;
    signers: Signers;
  }
}

export interface Contracts {
  auth: Auth;
  warper: ERC20RewardWarper;
  rewardToken: ERC20Mock;
}

export interface Mocks {
  warper: FakeContract<ERC20RewardWarper>;
  contractRegistry: ContractRegistryMock;
  erc20RewardDistributor: ERC20RewardDistributorMock;
  metahub: FakeContract<Metahub>;
  assets: {
    originalCollection: ERC721Mock;
    baseToken: ERC20Mock;
    rewardToken: ERC20Mock;
  };
}

export interface Signers {
  named: Record<string, SignerWithAddress>;
  unnamed: Array<SignerWithAddress>;
}
