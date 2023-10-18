import { shouldBeLikeIntegration } from './integration.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { Integration, IntegrationFeatureRegistry, ZeroBalance } from '../../../../typechain';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-protocol';

export function integrationTestIntegration(): void {
  describe('Integration', function () {
    beforeEach(async function () {
      const fixtureIntegration = async (): Promise<{
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        zeroBalanceFeature: ZeroBalance;
        zeroBalanceTestCollection: ERC721Mock;
        integration: Integration;
      }> => {
        // деплоим IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run(
          'deploy:feature-toggles:integration-feature-registry',
        )) as IntegrationFeatureRegistry;

        // Deploy ZeroBalance.sol
        const zeroBalanceFeature = (await hre.run('deploy:features:zero-balance', {
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as ZeroBalance;

        // Deploy original NFT
        const zeroBalanceTestCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        const integration = (await hre.run('deploy:feature-toggles:integration-contract', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as Integration;

        return {
          integrationFeatureRegistry,
          zeroBalanceFeature,
          zeroBalanceTestCollection,
          integration,
        };
      };

      const { integrationFeatureRegistry, zeroBalanceFeature, zeroBalanceTestCollection, integration } =
        await loadFixture(fixtureIntegration);

      this.contracts.feautureToggles.integrationContracts = {
        integration,
      };

      this.contracts.feautureToggles.integrationFeatureRegistryContracts = {
        integrationFeatureRegistry,
      };

      this.contracts.feautureToggles.featureContracts.zeroBalanceFeature = {
        controller: zeroBalanceFeature,
        zeroBalanceTestCollection,
      };
    });

    shouldBeLikeIntegration();
  });
}
