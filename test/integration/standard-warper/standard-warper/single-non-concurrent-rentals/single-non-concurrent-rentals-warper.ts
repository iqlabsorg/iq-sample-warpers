import { shouldBeLikeMultipleNonConcurrentRentals } from './single-non-concurrent-rentals.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-sdk-js';
import { StandardWarper } from '../../../../../typechain';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';

export function integrationTestSingleNonConcurrentRentals(): void {
  describe('SingleNonConcurrentRentals', function () {
    beforeEach(async function () {
      const fixtureStandardWarper = async (): Promise<{
        testZeroBalanceCollection: ERC721Mock;
        singleNonConcurrentRentals: StandardWarper;
      }> => {
        // Deploy original NFT
        const testZeroBalanceCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        const singleNonConcurrentRentals = (await hre.run('deploy:standard:standard-warper', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
          zeroBalanceCheckAddresses: [testZeroBalanceCollection.address],
          allowMultipleRentals: false,
          allowConcurrentRentals: false,
        })) as StandardWarper;

        return {
          testZeroBalanceCollection,
          singleNonConcurrentRentals,
        };
      };

      const { testZeroBalanceCollection, singleNonConcurrentRentals } = await loadFixture(fixtureStandardWarper);

      this.contracts.singleNonConcurrentRentals = {
        testZeroBalanceCollection,
        singleNonConcurrentRentals,
      };
    });

    shouldBeLikeMultipleNonConcurrentRentals();
  });
}
