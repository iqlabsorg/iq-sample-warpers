import { testVariousOperations } from './test-suites/test-various-operations';
import { testAccessControlAndMisc } from './test-suites/test-access-control-and-misc';

export function shouldBeLikeIntegration(): void {
  describe('Various operations', function () {
    testVariousOperations();
  });

  describe('Access Control & misc', function () {
    testAccessControlAndMisc();
  });
}
