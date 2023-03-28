import { shouldBehaveLikeAuth } from './auth.behaviour';
import hre from 'hardhat';
import { Auth } from '../../../typechain';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

export function unitTestAuth(): void {
  describe('Auth', function () {
    async function deployAuth(): Promise<Auth> {
      return (await hre.run('deploy:auth')) as Auth;
    }

    beforeEach(async function () {
      this.contracts.auth = await loadFixture(deployAuth);
    });

    shouldBehaveLikeAuth();
  });
}
