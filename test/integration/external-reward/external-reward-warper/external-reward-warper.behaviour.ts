import { testVariousWarperOperations } from './test-suites/test-various-warper-operations';
import { testWarperAccessControlAndMisc } from './test-suites/test-warper-access-control-and-misc';

export function shouldBeLikeExternalRewardWarper(): void {
  describe('Various Warper operations', function () {
    testVariousWarperOperations();
  });

  describe('Warper Access Control & misc', function () {
    testWarperAccessControlAndMisc();
  });
}
