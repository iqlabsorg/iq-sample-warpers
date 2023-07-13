import { testWarperAccessControlAndMisc } from './test-suites/test-warper-access-control-and-misc';

export function shouldBeLikeWarperForUniversus(): void {

  describe('Warper Access Control & misc', function () {
    testWarperAccessControlAndMisc();
  });

}