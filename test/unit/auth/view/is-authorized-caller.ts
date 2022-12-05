import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Auth } from '../../../../typechain';
import { expect } from 'chai';

export function shouldBehaveLikeIsAuthorizedCaller(): void {
  let auth: Auth;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    auth = this.contracts.auth;
    authorizedCaller = this.signers.named.authorizedCaller;
    stranger = this.signers.unnamed[2];

    await auth.setAuthorizationStatus(authorizedCaller.address, true);
  });

  context('when caller is not authorized', () => {
    it('returns false', async () => {
      await expect(auth.isAuthorizedCaller(stranger.address)).to.eventually.eq(false);
    });
  });

  context('when caller is authorized', () => {
    it('returns true', async () => {
      await expect(auth.isAuthorizedCaller(authorizedCaller.address)).to.eventually.eq(true);
    });
  });
}
