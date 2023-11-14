import { shouldBeLikeIntegration } from './integration.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { Integration, IntegrationFeatureRegistry, ZeroBalance } from '../../../../typechain';
import { ADDRESS_ZERO } from '@iqprotocol/iq-space-protocol';
import { IACL, IMetahub, ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';

export function integrationTestIntegration(): void {
  describe('Integration', function () {
    beforeEach(async function () {
      const fixtureIntegration = async (): Promise<{
        metahub: IMetahub;
        acl: IACL;
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        zeroBalanceFeature: ZeroBalance;
        zeroBalanceTestCollection: ERC721Mock;
        integration: Integration;
      }> => {
        const metahub = this.contracts.metahub;
        const acl = this.contracts.acl;

        // deploy IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run('deploy:feature-toggles:integration-feature-registry', {
          metahub: metahub.address,
          acl: acl.address,
        })) as IntegrationFeatureRegistry;

        // Deploy ZeroBalance.sol
        const zeroBalanceFeature = (await hre.run('deploy:features:zero-balance', {
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as ZeroBalance;

        // Deploy original NFT
        const zeroBalanceTestCollection = (await hre.run('deploy:test:mock:erc721', {
          name: 'Test Zero Balance Collection',
          symbol: 'TZNFT',
        })) as ERC721Mock;

        const integration = (await hre.run('deploy:feature-toggles:integration-contract', {
          original: this.mocks.assets.originalCollection.address,
          metahub: metahub.address,
          universeRewardAddress: ADDRESS_ZERO,
          integrationFeatureRegistry: integrationFeatureRegistry.address,
        })) as Integration;

        return {
          metahub,
          acl,
          integrationFeatureRegistry,
          zeroBalanceFeature,
          zeroBalanceTestCollection,
          integration,
        };
      };

      const { metahub, acl, integrationFeatureRegistry, zeroBalanceFeature, zeroBalanceTestCollection, integration } =
        await loadFixture(fixtureIntegration);

      this.contracts.metahub = metahub;
      this.contracts.acl = acl;

      this.contracts.feautureToggles.integrationContracts = {
        integration,
      };

      this.contracts.feautureToggles.integrationFeatureRegistryContracts = {
        integrationFeatureRegistry,
      };

      this.contracts.feautureToggles.featureContracts.zeroBalanceFeature = {
        controller: zeroBalanceFeature,
        zeroBalanceTestCollection,
      };
    });

    shouldBeLikeIntegration();
  });
}
