
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
// import { getSolidityInterfaceId } from '../../../../shared/utils/solidity-interfaces';
import {
  ADDRESS_ZERO,
  EMPTY_BYTES32_DATA_HEX,
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
} from '@iqprotocol/iq-space-protocol';
import { SolidityInterfaces, ZeroBalance } from '../../../../../../typechain';

export function testAccessControlAndMisc(): void {
  /**** Contracts ****/
  let zeroBalance: ZeroBalance;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let contractOwner: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    /**** Contracts ****/
    // zeroBalance = this.contracts.zeroBalance.zeroBalanceInstance;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [contractOwner, authorizedCaller, stranger] = this.signers.unnamed;

    // await zeroBalance.connect(deployer).transferOwnership(contractOwner.address);
    // await Auth__factory.connect(zeroBalance.address, contractOwner).setAuthorizationStatus(
    //   authorizedCaller.address,
    //   true,
    // );
  });

  // it(`does not work when execute is called by an unauthorized user`, async () => {
  //   await expect(
  //     zeroBalance.connect(stranger).execute(),
  //   ).to.be.revertedWithCustomError(zeroBalance, 'Unauthorized');
  // });

  // //check interfaces support
  // it('supports necessary interfaces', async () => {
  //   await expect(
  //     zeroBalance
  //       .connect(stranger)
  //       .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IYourInterface')),
  //   ).to.be.fulfilled;
  // });

  // Add more tests as needed
}
