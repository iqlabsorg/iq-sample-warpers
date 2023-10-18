import { shouldBeLikeZeroBalance } from './zero-balance.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain'; // предполагая, что у вас также может быть потребность в моках ERC721
import { IntegrationFeatureRegistry, ZeroBalance } from '../../../../../typechain';

export function integrationTestZeroBalance(): void {
  describe('ZeroBalance', function () {
    beforeEach(async function () {
      const fixtureZeroBalance = async (): Promise<{
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        zeroBalance: ZeroBalance;
        zeroBalanceTestCollection: ERC721Mock;
      }> => {
        // Deploy IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run(
          'deploy:feature-toggles:integration-feature-registry',
        )) as IntegrationFeatureRegistry;

        // Deploy ZeroBalance.sol
        const zeroBalance = (await hre.run('deploy:features:zero-balance', {
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as ZeroBalance;

        // ERC721 MOCK
        const zeroBalanceTestCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        return {
          integrationFeatureRegistry,
          zeroBalance,
          zeroBalanceTestCollection,
        };
      };

      const { integrationFeatureRegistry, zeroBalance, zeroBalanceTestCollection } = await loadFixture(
        fixtureZeroBalance,
      );

      this.contracts.feautureToggles.featureContracts.zeroBalanceFeature = {
        controller: zeroBalance,
        zeroBalanceTestCollection,
      };

      this.contracts.feautureToggles.integrationFeatureRegistryContracts = {
        integrationFeatureRegistry,
      };
    });

    shouldBeLikeZeroBalance();
  });
}
