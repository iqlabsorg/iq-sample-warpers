import { baseContext } from '../shared/contexts';
import { unitTestAuth } from './auth/auth';
import { integrationTestTRV } from './the-red-village';
import { integrationTestIQPixelsteins } from './iq-pixelsteins';
<<<<<<< HEAD
import { integrationTestForExternalRewardWarper } from './external-reward';
import { integrationTestMaxDurationRaffle } from './max-duration-raffle';
=======
import { integrationTestExternalReward } from './external-reward';
import { integrationTestMinimumThreshold } from './minimum-threshold';
import { integrationTestZeroBalance } from './zero-balance';
>>>>>>> origin/max-duration-raffle-warper

baseContext('Unit Tests', function () {
  unitTestAuth();
});

baseContext('Integration Tests', function () {
<<<<<<< HEAD
  integrationTestTRV();
  integrationTestIQPixelsteins();
  integrationTestForExternalRewardWarper();
  integrationTestMaxDurationRaffle();
=======
  integrationTestTRV();
  integrationTestIQPixelsteins();
  integrationTestExternalReward();
  integrationTestMinimumThreshold();
  integrationTestZeroBalance();
>>>>>>> origin/max-duration-raffle-warper
});
