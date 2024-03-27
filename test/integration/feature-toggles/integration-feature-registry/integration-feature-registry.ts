/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { shouldBehaveLikeIntegrationFeatureRegistry } from './integration-feature-registry.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { IntegrationFeatureRegistry } from '../../../../typechain';
import { IACL, IMetahub } from '@iqprotocol/iq-space-protocol/typechain';

export function integrationTestIntegrationFeatureRegistry(): void {
  describe('IntegrationFeatureRegistry', function () {
    beforeEach(async function () {
      const fixtureIntegrationFeatureRegistry = async (): Promise<{
        metahub: IMetahub;
        acl: IACL;
        integrationFeatureRegistry: IntegrationFeatureRegistry;
      }> => {
        const metahub = this.contracts.metahub;
        const acl = this.contracts.acl;

        const integrationFeatureRegistry = (await hre.run('deploy:feature-toggles:integration-feature-registry', {
          metahub: metahub.address,
          acl: acl.address,
        })) as IntegrationFeatureRegistry;

        return {
          metahub,
          acl,
          integrationFeatureRegistry,
        };
      };

      const { metahub, acl, integrationFeatureRegistry } = await loadFixture(fixtureIntegrationFeatureRegistry);

      this.contracts.metahub = metahub;
      this.contracts.acl = acl;
      this.contracts.feautureToggles.integrationFeatureRegistryContracts = {
        integrationFeatureRegistry,
      };
    });

    shouldBehaveLikeIntegrationFeatureRegistry();
  });
}
