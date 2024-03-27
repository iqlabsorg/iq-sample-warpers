import { testVariousOperations } from './test-suites/test-various-operations';
import { testAccessControlAndMisc } from './test-suites/test-access-control-and-misc';

export function shouldBehaveLikeIntegrationFeatureRegistry(): void {
  describe('Various operations', function () {
    testVariousOperations();
  });

  // describe('Warper Access Control & misc', function () {
  //   testAccessControlAndMisc();
  // });
}
