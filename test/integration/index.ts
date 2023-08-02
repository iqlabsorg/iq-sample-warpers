import { baseContext } from '../shared/contexts';
import { unitTestAuth } from './auth/auth';
import { integrationTestTRV } from './the-red-village';
import { integrationTestIQPixelsteins } from './iq-pixelsteins';
import { integrationTestExternalReward } from './external-reward';
import { integrationTestMinimumThreshold } from './minimum-threshold';
import { integrationTestZeroBalance } from './zero-balance';

baseContext('Unit Tests', function () {
  unitTestAuth();
});

baseContext('Integration Tests', function () {
  integrationTestTRV();
  integrationTestIQPixelsteins();
  integrationTestExternalReward();
  integrationTestMinimumThreshold();
  integrationTestZeroBalance();
});
