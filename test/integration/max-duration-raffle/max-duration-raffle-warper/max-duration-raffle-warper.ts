import { MaxDurationRaffleWarper } from '../../../../typechain';
import { shouldBehaveLikeMaxDurationRaffleWarper } from './max-duration-raffle-warper.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';

export function integrationTestMaxDurationRaffleWarper(): void {
  describe('MaxDurationRaffleWarper', function () {
    beforeEach(async function () {
      const fixtureMaxDurationRaffleWarper = async (): Promise<{
        maxDurationRaffleWarper: MaxDurationRaffleWarper;
      }> => {
        const maxDurationRaffleWarper = (await hre.run('deploy:max-duration:raffle-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
        })) as MaxDurationRaffleWarper;

        return {
          maxDurationRaffleWarper: maxDurationRaffleWarper,
        };
      };

      const { maxDurationRaffleWarper } = await loadFixture(fixtureMaxDurationRaffleWarper);

      this.contracts.maxDuration = {
        maxDurationRaffleWarper,
      };
    });

    shouldBehaveLikeMaxDurationRaffleWarper();
  });
}
