/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import hre, { deployments, ethers, getChainId } from 'hardhat';
import {
  ERC20Mock,
  ERC721Mock,
  IMetahub,
  IRentingManager,
  IListingWizardV1,
  IUniverseWizardV1,
  IWarperWizardV1,
  IUniverseRegistry,
  IListingManager,
  IListingTermsRegistry,
  ITaxTermsRegistry,
  ERC20
} from '@iqprotocol/solidity-contracts-nft/typechain';
import { Auth } from '../../typechain';
import type { Contracts, Mocks, Signers } from './types';
import { Contract } from "ethers";
import { ChainId } from "@iqprotocol/iq-space-sdk-js";

// eslint-disable-next-line func-style
export function baseContext(description: string, testSuite: () => void): void {
  describe(description, function () {
    before(async function () {
      this.contracts = {} as Contracts;
      this.mocks = {
        assets: {},
      } as Mocks;
      this.signers = {} as Signers;

      // Signer setup
      this.signers.named = await ethers.getNamedSigners();
      this.signers.unnamed = await ethers.getUnnamedSigners();

      // await deployments.fixture();
    });

    // beforeEach(async () => {
    //   this.timeout(120000);
    //
    //   const { auth, baseToken, contractsInfra, originalCollection } = await this.ctx.loadFixture(
    //     async (): Promise<any> => {
    //       // Auth deployment
    //       const auth = (await hre.run('deploy:auth')) as Auth;
    //
    //       const baseToken = (await hre.run('deploy:test:mock:erc20', {
    //         name: 'Test ERC20',
    //         symbol: 'ONFT',
    //         decimals: 18,
    //         totalSupply: 100_000_000,
    //       })) as ERC20Mock;
    //
    //       const contractsInfra = await hre.run('deploy:initial-deployment', {
    //         baseToken: baseToken.address,
    //         rentalFee: 100,
    //         unsafe: true
    //       });
    //
    //       const originalCollection = (await hre.run('deploy:test:mock:erc721', {
    //         name: 'Test ERC721',
    //         symbol: 'ONFT',
    //       })) as ERC721Mock;
    //
    //       return { auth, baseToken, contractsInfra, originalCollection };
    //     }
    //   )
    //
    //   const metahub = contractsInfra.metahub as IMetahub;
    //   const listingManager = contractsInfra.listingManager as IListingManager;
    //   const listingTermsRegistry = contractsInfra.listingTermsRegistry as IListingTermsRegistry;
    //   const rentingManager = contractsInfra.rentingManager as IRentingManager;
    //   const universeRegistry = contractsInfra.universeRegistry as IUniverseRegistry;
    //   const taxTermsRegistry = contractsInfra.taxTermsRegistry as ITaxTermsRegistry;
    //
    //   const listingWizardV1 = contractsInfra.listingWizardV1 as IListingWizardV1;
    //   const universeWizardV1 = contractsInfra.universeWizardV1 as IUniverseWizardV1;
    //   const warperWizardV1 = contractsInfra.warperWizardV1 as IWarperWizardV1;
    //
    //   this.ctx.testChainId = new ChainId({
    //     namespace: 'eip155',
    //     reference: await getChainId(),
    //   });
    //
    //   this.ctx.contracts.auth = auth;
    //   this.ctx.contracts.metahub = metahub;
    //
    //   this.ctx.contracts.listingManager = listingManager;
    //   this.ctx.contracts.listingTermsRegistry = listingTermsRegistry;
    //   this.ctx.contracts.rentingManager = rentingManager;
    //   this.ctx.contracts.universeRegistry = universeRegistry;
    //   this.ctx.contracts.taxTermsRegistry = taxTermsRegistry;
    //
    //   this.ctx.contracts.wizardsV1 = {
    //     listingWizard: listingWizardV1,
    //     universeWizard: universeWizardV1,
    //     warperWizard: warperWizardV1,
    //   };
    //
    //   this.ctx.mocks.assets.originalCollection = originalCollection;
    //   this.ctx.mocks.assets.baseToken = baseToken;
    // });

    testSuite();
  });
}
