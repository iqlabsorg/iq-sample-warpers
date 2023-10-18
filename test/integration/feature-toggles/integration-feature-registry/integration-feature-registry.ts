import { shouldBehaveLikeIntegrationFeatureRegistry } from './integration-feature-registry.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { IntegrationFeatureRegistry } from '../../../../typechain';

export function integrationTestIntegrationFeatureRegistry(): void {
  describe('IntegrationFeatureRegistry', function () {
    beforeEach(async function () {
      const fixtureIntegrationFeatureRegistry = async (): Promise<{
        integrationFeatureRegistry: IntegrationFeatureRegistry;
      }> => {
        const integrationFeatureRegistry = (await hre.run(
          'deploy:feature-toggles:integration-feature-registry',
        )) as IntegrationFeatureRegistry;

        return {
          integrationFeatureRegistry,
        };
      };

      const { integrationFeatureRegistry } = await loadFixture(fixtureIntegrationFeatureRegistry);

      this.contracts.feautureToggles.integrationFeatureRegistryContracts = {
        integrationFeatureRegistry,
      };
    });

    shouldBehaveLikeIntegrationFeatureRegistry();
  });
}
