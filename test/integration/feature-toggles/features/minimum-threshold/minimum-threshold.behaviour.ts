import { integrationTestMinimumThreshold } from './test-suites/test-various-operations';
// import { testAccessControlAndMisc } from './test-suites/test-access-control-and-misc';

export function shouldBeLikeMinimumThreshold(): void {
  describe('Various Warper operations', function () {
    // it('works');
    integrationTestMinimumThreshold();
  });

  // describe('Warper Access Control & misc', function () {
  //   testAccessControlAndMisc();
  // });
}
