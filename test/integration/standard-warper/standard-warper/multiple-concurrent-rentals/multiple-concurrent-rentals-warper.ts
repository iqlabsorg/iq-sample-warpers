import { shouldBeLikeMultipleConcurrentRentals } from './multiple-concurrent-rentals.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';
import { StandardWarper } from '../../../../../typechain';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';

export function integrationTestMultipleConcurrentRentals(): void {
  describe('MultipleConcurrentRentals', function () {
    beforeEach(async function () {
      const fixtureStandardWarper = async (): Promise<{
        testZeroBalanceCollection: ERC721Mock;
        multipleConcurrentRentals: StandardWarper;
      }> => {
        // Deploy original NFT
        const testZeroBalanceCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        const multipleConcurrentRentals = (await hre.run('deploy:standard:standard-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
          zeroBalanceCheckAddresses: [testZeroBalanceCollection.address],
          allowMultipleRentals: true,
          allowConcurrentRentals: true,
        })) as StandardWarper;

        return {
          testZeroBalanceCollection,
          multipleConcurrentRentals,
        };
      };

      const { testZeroBalanceCollection, multipleConcurrentRentals } = await loadFixture(fixtureStandardWarper);

      this.contracts.multipleConcurrentRentals = {
        testZeroBalanceCollection,
        multipleConcurrentRentals,
      };
    });

    shouldBeLikeMultipleConcurrentRentals();
  });
}
