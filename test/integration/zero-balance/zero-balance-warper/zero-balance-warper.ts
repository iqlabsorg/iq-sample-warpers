import { shouldBeLikeZeroBalanceWarper } from './zero-balance-warper.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';
import { ZeroBalanceWarper } from '../../../../typechain';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';

export function integrationTestZeroBalanceWarper(): void {
  describe('ZeroBalanceWarper', function () {
    beforeEach(async function () {
      const fixtureZeroBalanceWarper = async (): Promise<{
        testZeroBalanceCollection: ERC721Mock;
        zeroBalanceWarper: ZeroBalanceWarper;
      }> => {
        // Deploy original NFT
        const testZeroBalanceCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        const zeroBalanceWarper = (await hre.run('deploy:zero-balance:zero-balance-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
          zeroBalanceCheckAddresses: [testZeroBalanceCollection.address],
        })) as ZeroBalanceWarper;

        return {
          testZeroBalanceCollection,
          zeroBalanceWarper,
        };
      };

      const { testZeroBalanceCollection, zeroBalanceWarper } = await loadFixture(fixtureZeroBalanceWarper);

      this.contracts.zeroBalance = {
        testZeroBalanceCollection,
        zeroBalanceWarper,
      };
    });

    shouldBeLikeZeroBalanceWarper();
  });
}
