import { IQPixelsteinsArsenalWarper } from '../../../../typechain';
import { shouldBehaveLikeIQPixelsteinArsenalWarper } from './iq-pixelsteins-arsenal-warper.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';

export function integrationTestIQPixelsteinsArsenalWarper(): void {
  describe('IQPixelsteinsArsenalWarper', function () {
    beforeEach(async function () {
      const fixtureIQPixelsteinsArsenalWarper = async (): Promise<{
        iqPixelsteinsArsenalWarper: IQPixelsteinsArsenalWarper;
      }> => {
        const iqPixelsteinArsenalWarper = (await hre.run('deploy:iq-pixelsteins:arsenal-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
        })) as IQPixelsteinsArsenalWarper;

        return {
          iqPixelsteinsArsenalWarper: iqPixelsteinArsenalWarper,
        };
      };

      const { iqPixelsteinsArsenalWarper } = await loadFixture(fixtureIQPixelsteinsArsenalWarper);

      this.contracts.iqPixelsteins = {
        iqPixelsteinsArsenalWarper,
      };
    });

    shouldBehaveLikeIQPixelsteinArsenalWarper();
  });
}
