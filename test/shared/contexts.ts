/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import hre, { ethers, getChainId } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import type { Contracts, Mocks, Signers } from './types';
import {
  ERC20Mock,
  ERC721Mock,
  IListingManager,
  IListingTermsRegistry,
  IListingWizardV1,
  IMetahub,
  IRentingManager,
  ITaxTermsRegistry,
  IUniverseRegistry,
  IUniverseWizardV1,
  IWarperWizardV1,
} from '@iqprotocol/iq-space-protocol/typechain';
import { ChainId } from '@iqprotocol/iq-space-sdk-js';
import { IWarperManager, SolidityInterfaces } from '../../typechain';

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

    async function deployProtocol(): Promise<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contractsInfra: any;
      baseToken: ERC20Mock;
      originalCollection: ERC721Mock;
      solidityInterfaces: SolidityInterfaces;
    }> {
      const baseToken = (await hre.run('deploy:test:mock:erc20', {
        name: 'Test ERC20',
        symbol: 'ONFT',
        decimals: 18,
        totalSupply: 100_000_000,
      })) as ERC20Mock;

      const contractsInfra = await hre.run('deploy:initial-deployment', {
        baseToken: baseToken.address,
        protocolExternalFeesCollector: (await ethers.getNamedSigner('protocolExternalFeesCollector')).address,
        rentalFee: 100,
        unsafe: true,
      });

      const originalCollection = (await hre.run('deploy:test:mock:erc721', {
        name: 'Test ERC721',
        symbol: 'ONFT',
      })) as ERC721Mock;

      const solidityInterfaces = (await hre.run('deploy:mocks:misc:solidity-interfaces')) as SolidityInterfaces;

      return { baseToken, contractsInfra, originalCollection, solidityInterfaces };
    }

    beforeEach(async () => {
      this.timeout(120000);

      const { baseToken, contractsInfra, originalCollection, solidityInterfaces } = await loadFixture(deployProtocol);

      const metahub = contractsInfra.metahub as IMetahub;
      const listingManager = contractsInfra.listingManager as IListingManager;
      const listingTermsRegistry = contractsInfra.listingTermsRegistry as IListingTermsRegistry;
      const rentingManager = contractsInfra.rentingManager as IRentingManager;
      const universeRegistry = contractsInfra.universeRegistry as IUniverseRegistry;
      const warperManager = contractsInfra.warperManager as IWarperManager;
      const taxTermsRegistry = contractsInfra.taxTermsRegistry as ITaxTermsRegistry;

      const listingWizardV1 = contractsInfra.listingWizardV1 as IListingWizardV1;
      const universeWizardV1 = contractsInfra.universeWizardV1 as IUniverseWizardV1;
      const warperWizardV1 = contractsInfra.warperWizardV1 as IWarperWizardV1;

      this.ctx.testChainId = new ChainId({
        namespace: 'eip155',
        reference: await getChainId(),
      });

      this.ctx.contracts.metahub = metahub;

      this.ctx.contracts.listingManager = listingManager;
      this.ctx.contracts.listingTermsRegistry = listingTermsRegistry;
      this.ctx.contracts.rentingManager = rentingManager;
      this.ctx.contracts.universeRegistry = universeRegistry;
      this.ctx.contracts.warperManager = warperManager;
      this.ctx.contracts.taxTermsRegistry = taxTermsRegistry;

      this.ctx.contracts.wizardsV1 = {
        listingWizard: listingWizardV1,
        universeWizard: universeWizardV1,
        warperWizard: warperWizardV1,
      };

      this.ctx.mocks.assets.originalCollection = originalCollection;
      this.ctx.mocks.assets.baseToken = baseToken;

      this.ctx.mocks.misc = {
        solidityInterfaces,
      };
    });

    testSuite();
  });
}
