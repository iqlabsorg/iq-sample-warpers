import { testVariousOperations } from './test-suites/test-various-operations';
import { testAccessControlAndMisc } from './test-suites/test-access-control-and-misc';

export function shouldBeLikeIntegrationFeatureRegistry(): void {
  describe('Various Warper operations', function () {
    testVariousOperations();
  });

  describe('Warper Access Control & misc', function () {
    testAccessControlAndMisc();
  });
}