import { shouldBehaveLikeSetAuthorizationStatus } from './effects/set-authorization-status';
import { shouldBehaveLikeIsAuthorizedCaller } from './view/is-authorized-caller';

export function shouldBehaveLikeAuth(): void {
  describe('Effects Functions', function () {
    describe('setAuthorizationStatus', function () {
      shouldBehaveLikeSetAuthorizationStatus();
    });
  });

  describe('View Functions', function () {
    describe('isAuthorizedCaller', function () {
      shouldBehaveLikeIsAuthorizedCaller();
    });
  });
}
