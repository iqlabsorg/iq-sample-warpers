import { shouldBeLikeWarperForUniversus } from './warper-for-universus.behaviour';

export function integrationTestWarperForUniversus(): void {
  describe('Tests for Universus', function () {

    shouldBeLikeWarperForUniversus();
  });
}
