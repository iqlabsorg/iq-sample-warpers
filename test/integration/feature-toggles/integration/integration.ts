import { shouldBeLikeIntegration } from './integration.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { Integration, IntegrationFeatureRegistry } from '../../../../typechain';

const testConfigBytes = '0x1234567890abcdef'; //for tests

export function IntegrationTestIntegration(): void {
  describe('Integration', function () {
    beforeEach(async function () {
      const fixtureIntegration = async (): Promise<{
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        integration: Integration;
      }> => {
        // деплоим IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run('deploy:integration-feature-registry')) as IntegrationFeatureRegistry;

        const integration = (await hre.run('deploy:feature-toggles:integration', {
          integrationFeatureRegistry: integrationFeatureRegistry.address,
          config: testConfigBytes,
        })) as Integration;

        return {
          integrationFeatureRegistry,
          integration,
        };
      };

      const { integrationFeatureRegistry, integration } = await loadFixture(fixtureIntegration);

      this.contracts.integration = {
        integrationFeatureRegistry,
        integration,
      };
    });

    shouldBeLikeIntegration();
  });
}
