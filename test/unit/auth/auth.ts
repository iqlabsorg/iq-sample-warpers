import { shouldBehaveLikeAuth } from './auth.behaviour';
import hre from "hardhat";
import { Auth } from "../../../typechain";

export function unitTestAuth(): void {
  describe('Auth', async function () {

    beforeEach(async function () {
      this.contracts.auth = await this.loadFixture(
        async (): Promise<Auth> => {
          return (await hre.run('deploy:auth')) as Auth;
        }
      );
    });

    shouldBehaveLikeAuth();
  });
}
