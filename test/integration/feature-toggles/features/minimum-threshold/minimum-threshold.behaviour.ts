import { testVariousOperations } from './test-suites/test-various-operations';
// import { testAccessControlAndMisc } from './test-suites/test-access-control-and-misc';

export function shouldBeLikeMinimumThreshold(): void {
  describe('Test various operations', function () {
    testVariousOperations();
  });

  // describe('Warper Access Control & misc', function () {
  //   testAccessControlAndMisc();
  // });
}
