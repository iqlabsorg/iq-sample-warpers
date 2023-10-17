import { shouldBeLikeZeroBalance } from './zero-balance.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ZeroBalance, IntegrationFeatureRegistry } from '../../../../typechain';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain'; // предполагая, что у вас также может быть потребность в моках ERC721

export function integrationTestZeroBalance(): void {
  describe('ZeroBalance', function () {
    beforeEach(async function () {
      const fixtureZeroBalance = async (): Promise<{
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        zeroBalance: ZeroBalance;
        testZeroBalanceCollection?: ERC721Mock;  // Только если вам нужен мок ERC721
      }> => {
        // Deploy IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run('deploy:integration-feature-registry')) as IntegrationFeatureRegistry;

        // Deploy ZeroBalance.sol
        const zeroBalance = (await hre.run('deploy:zero-balance', {
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as ZeroBalance;

        // ERC721 MOCK
        const testZeroBalanceCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        return {
          integrationFeatureRegistry,
          zeroBalance,
          testZeroBalanceCollection, // if we need ERC721 MOCK
        };
      };

      const { integrationFeatureRegistry, zeroBalance, testZeroBalanceCollection } = await loadFixture(fixtureZeroBalance);

      this.contracts.zeroBalance = {
        integrationFeatureRegistry,
        zeroBalance,
        testZeroBalanceCollection, // if we need ERC721 MOCK
      };
    });

    shouldBeLikeZeroBalance();
  });
}
