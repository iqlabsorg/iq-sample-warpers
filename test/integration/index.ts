import { baseContext } from '../shared/contexts';
import { unitTestAuth } from './auth/auth';
import { integrationTestTRV } from './the-red-village';
import { integrationTestIQPixelsteins } from './iq-pixelsteins';
import { integrationTestForExternalRewardWarper } from './external-reward';
import { integrationTestMaxDurationRaffle } from './max-duration-raffle';

baseContext('Unit Tests', function () {
  unitTestAuth();
});

baseContext('Integration Tests', function () {
  // integrationTestTRV();
  // integrationTestIQPixelsteins();
  // integrationTestForExternalRewardWarper();
  integrationTestMaxDurationRaffle();
});
