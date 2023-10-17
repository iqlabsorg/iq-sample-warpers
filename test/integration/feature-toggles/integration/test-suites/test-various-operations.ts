import { Integration, Integration__factory, IntegrationFeatureRegistry } from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

export function testVariousOperations(): void {
  /**** Contracts ****/
  let integration: Integration;
  let integrationFeatureRegistry: IntegrationFeatureRegistry;
  /**** Mocks & Samples ****/
  // Mocked data or samples to be added as needed
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let featureOwner: SignerWithAddress;
  let userA: SignerWithAddress;
  let userB: SignerWithAddress;

  beforeEach(async function () {
    /**** Contracts ****/
    const IntegrationFactory = new Integration__factory(deployer);
    integrationFeatureRegistry = await new IntegrationFeatureRegistry__factory(deployer).deploy();
    await integrationFeatureRegistry.deployed();

    const config = '0x';  // Placeholder for bytes config
    integration = await IntegrationFactory.deploy(integrationFeatureRegistry.address, config);
    await integration.deployed();

    /**** Mocks & Samples ****/
    /**** Signers ****/
    [deployer, featureOwner, userA, userB] = await ethers.getSigners();
  });

  describe('Integration Contract Operations', function () {
    it('should execute a feature correctly', async function () {
      // Setup a sample feature in the registry
      const featureId = BigNumber.from(1);
      await integrationFeatureRegistry.connect(featureOwner).registerFeatureController(featureId, userA.address);

      // Mock ExecutionObject for the test
      const mockExecutionObject = {
        rentalId: BigNumber.from(1),
      };

      // Execute the feature
      const [success, message] = await integration.connect(userA).executeFeature(featureId, mockExecutionObject);

      expect(success).to.equal(true);
      expect(message).to.equal(""); // мы можем сравнивать код ошибки
    });

    it('should not execute an inactive feature', async function () {
      const inactiveFeatureId = BigNumber.from(999); // 999 is an inactive feature ID
      const mockExecutionObject = {
        rentalId: BigNumber.from(1),
        // more mock data here
      };

      // Try to execute the inactive feature
      await expect(integration.connect(userA).executeFeature(inactiveFeatureId, mockExecutionObject)).to.be.revertedWith('Feature is not active');
    });

    // ADD TESTS

  });
}
