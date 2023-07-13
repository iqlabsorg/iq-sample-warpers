import {
  ERC20Mock,
  ERC721Mock,
  IListingWizardV1,
  IUniverseWizardV1,
  IMetahub,
  IRentingManager,
  IWarperWizardV1,
  IUniverseRegistry,
  IListingManager,
  IListingTermsRegistry,
  ITaxTermsRegistry,
} from '@iqprotocol/iq-space-protocol/typechain';
import {
  Auth,
  ERC20RewardWarperForTRV,
  UniversusWarper,
  IQPixelsteinsArsenalWarper,
  IWarperManager,
  SolidityInterfaces,
} from '../../typechain';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

declare module 'mocha' {
  interface Context {
    contracts: Contracts;
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
  warperManager: IWarperManager;
  taxTermsRegistry: ITaxTermsRegistry;

  wizardsV1: {
    listingWizard: IListingWizardV1;
    universeWizard: IUniverseWizardV1;
    warperWizard: IWarperWizardV1;
  };

  theRedVillage: TheRedVillageContracts;
  iqPixelsteins: IQPixelsteinsContracts;
  universus: UniversusContracts;
}

interface TheRedVillageContracts {
  erc20RewardWarperForTRV: ERC20RewardWarperForTRV;
  rewardToken: ERC20Mock;
}

interface UniversusContracts {
  warperForUniversus: UniversusWarper;
}

interface IQPixelsteinsContracts {
  iqPixelsteinsArsenalWarper: IQPixelsteinsArsenalWarper;
}

export interface Mocks {
  assets: {
    originalCollection: ERC721Mock;
    baseToken: ERC20Mock;
  };
  misc: {
    solidityInterfaces: SolidityInterfaces;
  };
}

export interface Signers {
  named: Record<string, SignerWithAddress>;
  unnamed: Array<SignerWithAddress>;
}
