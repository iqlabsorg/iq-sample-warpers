import { shouldBeLikeMinimumThresholdWarper } from './minimum-threshold-warper.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';
import { MinimumThresholdWarper } from '../../../../typechain';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';

export function integrationTestMinimumThresholdWarper(): void {
  describe('MinimumThresholdWarper', function () {
    beforeEach(async function () {
      const fixtureMinimumThresholdWarper = async (): Promise<{
        testThresholdCollection: ERC721Mock;
        minimumThresholdWarper: MinimumThresholdWarper;
      }> => {
        // Deploy original NFT
        const testThresholdCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Minimum Threshold Collection',
          symbol: 'TNFT',
        })) as ERC721Mock;

        const minimumThresholdWarper = (await hre.run('deploy:minimum-threshold:minimum-threshold-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
          requiredCollectionAddresses: [testThresholdCollection.address],
          requiredMinimumCollectionAmountThresholds: [1],
        })) as MinimumThresholdWarper;

        return {
          testThresholdCollection,
          minimumThresholdWarper,
        };
      };

      const { testThresholdCollection, minimumThresholdWarper } = await loadFixture(fixtureMinimumThresholdWarper);

      this.contracts.minimumThreshold = {
        minimumThresholdWarper,
        testThresholdCollection,
      };
    });

    shouldBeLikeMinimumThresholdWarper();
  });
}
