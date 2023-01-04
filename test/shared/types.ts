import {
  ERC20Mock,
  ERC721Mock,
  IListingWizardV1,
  IUniverseWizardV1,
  IMetahub,
  IRentingManager, IWarperWizardV1, IUniverseRegistry, IListingManager, IListingTermsRegistry, ITaxTermsRegistry,
} from '@iqprotocol/solidity-contracts-nft/typechain';
import { Auth, ERC20RewardWarperForTRV } from '../../typechain';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
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
  metahub: IMetahub;
  listingManager: IListingManager;
  listingTermsRegistry: IListingTermsRegistry;
  rentingManager: IRentingManager;
  universeRegistry: IUniverseRegistry;
  taxTermsRegistry: ITaxTermsRegistry;

  wizardsV1: {
    listingWizard: IListingWizardV1;
    universeWizard: IUniverseWizardV1;
    warperWizard: IWarperWizardV1;
  };

  theRedVillage: TheRedVillageContracts;
}

interface TheRedVillageContracts {
  erc20RewardWarperForTRV: ERC20RewardWarperForTRV;
  rewardToken: ERC20Mock;
}

export interface Mocks {
  assets: {
    originalCollection: ERC721Mock;
    baseToken: ERC20Mock;
  };
}

export interface Signers {
  named: Record<string, SignerWithAddress>;
  unnamed: Array<SignerWithAddress>;
}
