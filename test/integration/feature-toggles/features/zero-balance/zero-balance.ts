import { shouldBeLikeZeroBalance } from './zero-balance.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ERC721Mock, IACL, IMetahub } from '@iqprotocol/iq-space-protocol/typechain';
import { Integration, IntegrationFeatureRegistry, ZeroBalance } from '../../../../../typechain';

export function integrationTestZeroBalance(): void {
  describe('ZeroBalance', function () {
    beforeEach(async function () {
      const fixtureZeroBalance = async (): Promise<{
        metahub: IMetahub;
        acl: IACL;
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        zeroBalance: ZeroBalance;
        zeroBalanceTestCollection: ERC721Mock;
        integration: Integration;
      }> => {
        const metahub = this.contracts.metahub;
        const acl = this.contracts.acl;

        // deploy IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run('deploy:feature-toggles:integration-feature-registry', {
          metahub: metahub.address,
          acl: acl.address,
        })) as IntegrationFeatureRegistry;

        // Deploy ZeroBalance.sol
        const zeroBalance = (await hre.run('deploy:features:zero-balance', {
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as ZeroBalance;

        // ERC721 MOCK
        const zeroBalanceTestCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        const integration = (await hre.run('deploy:feature-toggles:integration-contract', {
          original: this.mocks.assets.originalCollection.address,
          metahub: metahub.address,
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as Integration;

        return {
          metahub,
          acl,
          integrationFeatureRegistry,
          zeroBalance,
          zeroBalanceTestCollection,
          integration,
        };
      };

      const { metahub, acl, integrationFeatureRegistry, zeroBalance, zeroBalanceTestCollection, integration } =
        await loadFixture(fixtureZeroBalance);

      this.contracts.metahub = metahub;
      this.contracts.acl = acl;

      this.contracts.feautureToggles.integrationContracts = {
        integration,
      };

      this.contracts.feautureToggles.featureContracts.zeroBalanceFeature = {
        controller: zeroBalance,
        zeroBalanceTestCollection,
      };

      this.contracts.feautureToggles.integrationFeatureRegistryContracts = {
        integrationFeatureRegistry,
      };
    });

    shouldBeLikeZeroBalance();
  });
}
