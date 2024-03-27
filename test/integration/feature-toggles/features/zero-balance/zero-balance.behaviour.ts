import { testVariousOperations } from './test-suites/test-various-operations';
import { testAccessControlAndMisc } from './test-suites/test-access-control-and-misc';

export function shouldBeLikeZeroBalance(): void {
  describe('Various operations', function () {
    testVariousOperations();
  });

  describe('Feature Access Control & misc', function () {
    testAccessControlAndMisc();
  });
}
