import { shouldBeLikeWarperForUniversus } from './warper-for-universus.behaviour';
import { UniversusWarper } from '../../../../typechain';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';

export function integrationTestWarperForUniversus(): void {
  describe('Tests for Universus', function () {
    beforeEach(async function () {
      const fixtureExternalRewardWarperForUniversus = async (): Promise<{
        warperForUniversus: UniversusWarper;
      }> => {
        const warperForUniversus = (await hre.run('deploy:trv:external-reward-warper-for-universus', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
        })) as UniversusWarper;

        return {
          warperForUniversus,
        };
      };

      const { warperForUniversus } = await loadFixture(fixtureExternalRewardWarperForUniversus);

      this.contracts.universus = {
        warperForUniversus,
      };
    });

    shouldBeLikeWarperForUniversus();
  });
}
