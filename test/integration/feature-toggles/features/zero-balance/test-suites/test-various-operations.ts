import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

import { ERC721Mock } from '@iqprotocol/iq-space-protocol/typechain';
import { IntegrationFeatureRegistry, ZeroBalance } from '../../../../../../typechain';

export function testVariousOperations(): void {
  let zeroBalance: ZeroBalance;
  let integrationFeatureRegistry: IntegrationFeatureRegistry;

  let deployer: SignerWithAddress;
  let owner: SignerWithAddress;
  let unauthorizedUser: SignerWithAddress;

  // If we need ERC721 MOCK for tests
  let testZeroBalanceCollection: ERC721Mock;

  beforeEach(async function () {
    // zeroBalance = this.contracts.zeroBalance.zeroBalance;
    // integrationFeatureRegistry = this.contracts.zeroBalance.integrationFeatureRegistry;

    testZeroBalanceCollection = this.contracts.zeroBalance.testZeroBalanceCollection; // if we need ERC721 MOCK

    // Signers
    deployer = this.signers.named.deployer;
    [owner, unauthorizedUser] = this.signers.unnamed;
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
