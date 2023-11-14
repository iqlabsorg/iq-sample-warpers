import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { IACL, IMetahub, ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';
import { solidityIdBytes32, solidityIdBytes4 } from '@iqprotocol/iq-space-protocol';
import { IntegrationFeatureRegistry, ZeroBalance } from '../../../../../../typechain';

export function testVariousOperations(): void {
  /*** Contracts ***/
  let zeroBalance: ZeroBalance;
  let testZeroBalanceCollection: ERC721Mock;

  let metahub: IMetahub;
  let acl: IACL;
  let integrationFeatureRegistry: IntegrationFeatureRegistry;

  const INTEGRATION_FEATURE_REGISTRY_CONTRACT_KEY = solidityIdBytes4('IntegrationFeatureRegistry');
  const ZERO_BALANCE_CONTRACT_KEY = solidityIdBytes4('ZeroBalance');
  const INTEGRATION_FEATURES_ADMIN_ROLE = solidityIdBytes32('INTEGRATION_FEATURES_ADMIN_ROLE');

  /*** Mocks & Samples ***/
  // Mocked data or samples to be added as needed

  /*** Signers ***/
  let deployer: SignerWithAddress;
  let featuresAdmin: SignerWithAddress;
  let integrationContract: SignerWithAddress;
  let stranger: SignerWithAddress;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    /*** Contracts ***/
    metahub = this.contracts.metahub;
    acl = this.contracts.acl;
    integrationFeatureRegistry =
      this.contracts.feautureToggles.integrationFeatureRegistryContracts.integrationFeatureRegistry;

    /*** Mocks & Samples ***/
    testZeroBalanceCollection = this.contracts.zeroBalance.testZeroBalanceCollection;

    /*** Signers ***/
    deployer = this.signers.named.deployer;
    [featuresAdmin, integrationContract, stranger, owner, deployer] = this.signers.unnamed;

    /*** Setup ***/
    await metahub
      .connect(deployer)
      .registerContract(INTEGRATION_FEATURE_REGISTRY_CONTRACT_KEY, integrationFeatureRegistry.address);
    await acl.connect(deployer).grantRole(INTEGRATION_FEATURES_ADMIN_ROLE, featuresAdmin.address);
  });

  context('Zero Balance Feature Operations', () => {
    it('should pass tests', async () => {
      console.log('test');
    });
  });


  // context('Setting Zero Balance Addresses for an Integration', () => {
  //   it('should allow owner to set zero balance addresses', async () => {
  //     const initialAddresses = await zeroBalance.getZeroBalanceAddresses(deployer.address);
  //     expect(initialAddresses.length).to.equal(0);

  //     // Try to set zero balance addresses
  //     const addressesToSet = [testZeroBalanceCollection.address];
  //     await zeroBalance.setZeroBalanceAddresses(deployer.address, addressesToSet);

  //     const updatedAddresses = await zeroBalance.getZeroBalanceAddresses(deployer.address);
  //     expect(updatedAddresses[0]).to.equal(addressesToSet[0]);
  //   });

  //   it('should not allow unauthorized users to set zero balance addresses', async () => {
  //     const addressesToSet = [testZeroBalanceCollection.address];
  //     await expect(zeroBalance.connect(unauthorizedUser).setZeroBalanceAddresses(deployer.address, addressesToSet)).to.be.revertedWith("One or more addresses are already added"); // Assuming there's a permission check in the contract for this
  //   });
  // });

  // context('Miscellaneous operations for Zero Balance', () => {
  //   it('should perform some miscellaneous operation', async () => {
  //     //TESTS
  //   });
  // });
}
