import { shouldBeLikeExternalRewardWarper } from './external-reward-warper.behaviour';
import { ExternalRewardWarper } from '../../../../typechain';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';

export function integrationTestExternalRewardWarper(): void {
  describe('Tests for External Reward Warper', function () {
    beforeEach(async function () {
      const fixtureExternalRewardWarper = async (): Promise<{
        externalRewardWarper: ExternalRewardWarper;
      }> => {
        const externalRewardWarper = (await hre.run('deploy:external-reward:external-reward-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
        })) as ExternalRewardWarper;

        return {
          externalRewardWarper,
        };
      };

      const { externalRewardWarper } = await loadFixture(fixtureExternalRewardWarper);

      this.contracts.externalReward = {
        externalRewardWarper,
      };
    });

    shouldBeLikeExternalRewardWarper();
  });
}
