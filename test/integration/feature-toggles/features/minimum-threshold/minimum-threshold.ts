import { shouldBeLikeMinimumThreshold } from './minimum-threshold.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';
import { IntegrationFeatureRegistry, MinimumThreshold } from '../../../../../typechain';

export function integrationTestMinimumThreshold(): void {
  describe('MinimumThreshold', function () {
    beforeEach(async function () {
      const fixtureMinimumThreshold = async (): Promise<{
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        minimumThreshold: MinimumThreshold;
        minimumThresholdTestCollection: ERC721Mock;
      }> => {
        // Deploy IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run(
          'deploy:feature-toggles:integration-feature-registry',
        )) as IntegrationFeatureRegistry;

        // ERC721 MOCK
        const minimumThresholdTestCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Minimum Threshold Collection',
          symbol: 'TMTC',
        })) as ERC721Mock;

        // Deploy MinimumThreshold contract
        const minimumThreshold = (await hre.run('deploy:minimum-threshold:minimum-threshold-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: '0x...',
          requiredCollectionAddresses: [minimumThresholdTestCollection],
          requiredMinimumCollectionAmountThresholds: [1],
        })) as MinimumThreshold;

        return {
          integrationFeatureRegistry,
          minimumThreshold,
          minimumThresholdTestCollection,
        };
      };

      const { integrationFeatureRegistry, minimumThreshold, minimumThresholdTestCollection } = await loadFixture(
        fixtureMinimumThreshold,
      );

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
