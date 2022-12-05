import { shouldBehaveLikeAuth } from './auth.behaviour';

export function unitTestAuth(): void {
  describe('Auth', function () {
    shouldBehaveLikeAuth();
  });
}
