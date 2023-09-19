import { shouldBeLikeMultipleNonConcurrentRentals } from './multiple-non-concurrent-rentals.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';
import { StandardWarper } from '../../../../../typechain';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';

export function integrationTestMultipleNonConcurrentRentals(): void {
  describe('MultipleNonConcurrentRentals', function () {
    beforeEach(async function () {
      const fixtureStandardWarper = async (): Promise<{
        testZeroBalanceCollection: ERC721Mock;
        multipleNonConcurrentRentals: StandardWarper;
      }> => {
        // Deploy original NFT
        const testZeroBalanceCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        const multipleNonConcurrentRentals = (await hre.run('deploy:standard:standard-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
          zeroBalanceCheckAddresses: [testZeroBalanceCollection.address],
          allowMultipleRentals: true,
          allowConcurrentRentals: false,
        })) as StandardWarper;

        return {
          testZeroBalanceCollection,
          multipleNonConcurrentRentals,
        };
      };

      const { testZeroBalanceCollection, multipleNonConcurrentRentals } = await loadFixture(fixtureStandardWarper);

      this.contracts.multipleNonCurrentRentals = {
        testZeroBalanceCollection,
        multipleNonConcurrentRentals,
      };
    });

    shouldBeLikeMultipleNonConcurrentRentals();
  });
}
