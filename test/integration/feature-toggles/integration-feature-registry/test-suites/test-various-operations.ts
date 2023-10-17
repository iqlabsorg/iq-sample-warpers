import { IntegrationFeatureRegistry, IntegrationFeatureRegistry__factory } from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

export function testVariousOperations(): void {
  /*** Contracts ***/
  let integrationFeatureRegistry: IntegrationFeatureRegistry;

  /*** Mocks & Samples ***/
  // Mocked data or samples to be added as needed

  /*** Signers ***/
  let deployer: SignerWithAddress;
  let registryOwner: SignerWithAddress;
  let userA: SignerWithAddress;
  let userB: SignerWithAddress;

  beforeEach(async function () {
    /*** Contracts ***/
    integrationFeatureRegistry = await new IntegrationFeatureRegistry__factory(deployer).deploy();
    await integrationFeatureRegistry.deployed();

    /*** Mocks & Samples ***/

    /*** Signers ***/
    [deployer, registryOwner, userA, userB] = await ethers.getSigners();
  });

  describe('IntegrationFeatureRegistry Contract Operations', function () {
    it('should register a feature controller correctly', async function () {
      const featureId = BigNumber.from(1);
      await integrationFeatureRegistry.connect(registryOwner).registerFeatureController(featureId, userA.address);

      const controller = await integrationFeatureRegistry.getFeatureController(featureId);
      expect(controller).to.equal(userA.address);
    });

    it('should not register a feature controller if not the owner', async function () {
      const featureId = BigNumber.from(2);
      await expect(
        integrationFeatureRegistry.connect(userA).registerFeatureController(featureId, userB.address),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    // ADD MORE TEST HERE
  });
}
