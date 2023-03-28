import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Auth } from '../../../../typechain';
import { expect } from 'chai';

export function shouldBehaveLikeSetAuthorizationStatus(): void {
  let auth: Auth;
  let deployer: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let authorizedCaller2: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    auth = this.contracts.auth;
    deployer = this.signers.named.deployer;
    [authorizedCaller, authorizedCaller2, stranger] = this.signers.unnamed;

    await auth.setAuthorizationStatus(authorizedCaller.address, true);
  });

  context('when msg.sender is not an owner', () => {
    it('reverts', async () => {
      await expect(auth.connect(stranger).setAuthorizationStatus(authorizedCaller2.address, true)).to.be.reverted;
    });
  });

  context('when msg.sender is an owner', () => {
    it('updates status', async () => {
      await auth.connect(deployer).setAuthorizationStatus(authorizedCaller2.address, true);
      await expect(auth.isAuthorizedCaller(authorizedCaller2.address)).to.eventually.eq(true);
    });
  });
}
