import { shouldBeLikeMinimumThreshold } from './minimum-threshold.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { MinimumThreshold, IntegrationFeatureRegistry } from '../../../../typechain';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';

export function integrationTestMinimumThreshold(): void {
  describe('MinimumThreshold', function () {
    beforeEach(async function () {
      const fixtureMinimumThreshold = async (): Promise<{
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        minimumThreshold: MinimumThreshold;
        testMinimumThresholdCollection?: ERC721Mock;  // Только если вам нужен мок ERC721
      }> => {
        // Deploy IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run('deploy:integration-feature-registry')) as IntegrationFeatureRegistry;

        // Deploy MinimumThreshold contract
        const minimumThreshold = (await hre.run('deploy:minimum-threshold:minimum-threshold-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: '0x...',
          requiredCollectionAddresses:
          requiredMinimumCollectionAmountThresholds:
        })) as MinimumThreshold;

        // ERC721 MOCK
        const testMinimumThresholdCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Minimum Threshold Collection',
          symbol: 'TMTC',
        })) as ERC721Mock;

        return {
          integrationFeatureRegistry,
          minimumThreshold,
          testMinimumThresholdCollection,
        };
      };

      const { integrationFeatureRegistry, minimumThreshold, testMinimumThresholdCollection } = await loadFixture(fixtureMinimumThreshold);

      this.contracts.minimumThreshold = {
        integrationFeatureRegistry,
        minimumThreshold,
        testMinimumThresholdCollection,
      };
    });

    shouldBeLikeMinimumThreshold();
  });
}
