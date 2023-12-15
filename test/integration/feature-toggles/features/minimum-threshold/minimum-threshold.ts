import { shouldBeLikeMinimumThreshold } from './minimum-threshold.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ERC721Mock, IACL, IMetahub } from '@iqprotocol/iq-space-protocol/typechain';
import { Integration, IntegrationFeatureRegistry, MinimumThreshold } from '../../../../../typechain';

export function integrationTestMinimumThreshold(): void {
  describe('MinimumThreshold', function () {
    beforeEach(async function () {
      const fixtureMinimumThreshold = async (): Promise<{
        metahub: IMetahub;
        acl: IACL;
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        minimumThreshold: MinimumThreshold;
        minimumThresholdTestCollection: ERC721Mock;
        integration: Integration;
      }> => {
        const metahub = this.contracts.metahub;
        const acl = this.contracts.acl;

        // Deploy IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run('deploy:feature-toggles:integration-feature-registry', {
          metahub: metahub.address,
          acl: acl.address,
        })) as IntegrationFeatureRegistry;

        // ERC721 MOCK
        const minimumThresholdTestCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Minimum Threshold Collection',
          symbol: 'TMTC',
        })) as ERC721Mock;

        // Deploy MinimumThreshold contract
        const minimumThreshold = (await hre.run('deploy:features:minimum-threshold', {
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as MinimumThreshold;

        const integration = (await hre.run('deploy:feature-toggles:integration-contract', {
          original: this.mocks.assets.originalCollection.address,
          metahub: metahub.address,
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as Integration;

        return {
          metahub,
          acl,
          integrationFeatureRegistry,
          minimumThreshold,
          minimumThresholdTestCollection,
          integration,
        };
      };

      const {
        metahub,
        acl,
        integration,
        integrationFeatureRegistry,
        minimumThreshold,
        minimumThresholdTestCollection,
      } = await loadFixture(fixtureMinimumThreshold);

      this.contracts.metahub = metahub;
      this.contracts.acl = acl;

      this.contracts.feautureToggles.integrationContracts = {
        integration,
      };

      this.contracts.feautureToggles.featureContracts.minimumThresholdFeature = {
        controller: minimumThreshold,
        minimumThresholdTestCollection,
      };

      this.contracts.feautureToggles.integrationFeatureRegistryContracts = {
        integrationFeatureRegistry,
      };
    });

    shouldBeLikeMinimumThreshold();
  });
}
