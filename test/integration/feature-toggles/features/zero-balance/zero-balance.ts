import { shouldBeLikeZeroBalance } from './zero-balance.behaviour';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ERC721Mock, IACL, IMetahub } from '@iqprotocol/iq-space-protocol/typechain'; // предполагая, что у вас также может быть потребность в моках ERC721
import { IntegrationFeatureRegistry, ZeroBalance } from '../../../../../typechain';
import { ADDRESS_ZERO, solidityIdBytes32, solidityIdBytes4 } from '@iqprotocol/iq-space-protocol';

export function integrationTestZeroBalance(): void {

  const INTEGRATION_FEATURE_REGISTRY_CONTRACT_KEY = solidityIdBytes4('IntegrationFeatureRegistry');
  const ZERO_BALANCE_CONTRACT_KEY = solidityIdBytes4('ZeroBalance');
  const INTEGRATION_FEATURES_ADMIN_ROLE = solidityIdBytes32('INTEGRATION_FEATURES_ADMIN_ROLE');

  /*** Contracts ***/
  let metahub: IMetahub;
  let acl: IACL;
  let integrationFeatureRegistry: IntegrationFeatureRegistry;

  let deployer: SignerWithAddress;

  describe('ZeroBalance', function () {
    beforeEach(async function () {

      metahub = this.contracts.metahub;
      acl = this.contracts.acl;

      const fixtureZeroBalance = async (): Promise<{
        integrationFeatureRegistry: IntegrationFeatureRegistry;
        zeroBalance: ZeroBalance;
        zeroBalanceTestCollection: ERC721Mock;
      }> => {
        // Deploy IntegrationFeatureRegistry
        const integrationFeatureRegistry = (await hre.run('deploy:feature-toggles:integration-feature-registry', {
          metahub: metahub.address,
          acl: acl.address,
        })) as IntegrationFeatureRegistry;

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
