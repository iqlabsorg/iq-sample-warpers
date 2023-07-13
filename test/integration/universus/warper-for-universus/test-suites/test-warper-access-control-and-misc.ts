import { Auth__factory, UniversusWarper, SolidityInterfaces } from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export function testWarperAccessControlAndMisc(): void {
  /**** Contracts ****/
  let warperForUniversus: UniversusWarper;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let warperOwner: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    /**** Contracts ****/
    warperForUniversus = this.contracts.universus.warperForUniversus;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [warperOwner, authorizedCaller, stranger] = this.signers.unnamed;

    await warperForUniversus.connect(deployer).transferOwnership(warperOwner.address);
    await Auth__factory.connect(warperForUniversus.address, warperOwner).setAuthorizationStatus(
      authorizedCaller.address,
      true,
    );
  });
}
