import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { IntegrationFeatureRegistry, MinimumThreshold, IERC721 } from '../../../../typechain';

export function integrationTestMinimumThreshold(): void {
  describe('MinimumThreshold', function () {
    let minimumThreshold: MinimumThreshold;
    let integrationFeatureRegistry: IntegrationFeatureRegistry;
    let erc721: IERC721;

    beforeEach(async function () {
      const fixture = async (): Promise<{
        minimumThreshold: MinimumThreshold;
        integrationFeatureRegistry: IntegrationFeatureRegistry;
      }> => {
        // Deploy IntegrationFeatureRegistry
        integrationFeatureRegistry = (await hre.run('deploy:feature-toggles:integration-feature-registry')) as IntegrationFeatureRegistry;

        // Deploy MinimumThreshold
        minimumThreshold = await hre.ethers.getContractFactory('MinimumThreshold').deploy(integrationFeatureRegistry.address);

        return {
          minimumThreshold,
          integrationFeatureRegistry,
        };
      };

      const { minimumThreshold: minThresholdInstance, integrationFeatureRegistry: ifrInstance } = await loadFixture(fixture);
      minimumThreshold = minThresholdInstance;
      integrationFeatureRegistry = ifrInstance;

      // ERC721 MOCK
      const ERC721Factory = await hre.ethers.getContractFactory("DummyERC721");
      erc721 = await ERC721Factory.deploy();
      await erc721.deployed();
    });

    it('should set integration requirements correctly', async function () {
      const integrationAddress = "0x123..."; // Dummy address
      await minimumThreshold.setIntegration(integrationAddress, [erc721.address], [5]);

      const fetchedAddresses = await minimumThreshold.getRequiredCollectionAddresses(integrationAddress);
      expect(fetchedAddresses).to.deep.equal([erc721.address]);

      const fetchedThresholds = await minimumThreshold.getRequiredCollectionMinimumThresholds(integrationAddress);
      expect(fetchedThresholds).to.deep.equal([5]);
    });

  });
}
