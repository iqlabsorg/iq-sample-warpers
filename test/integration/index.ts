import { baseContext } from '../shared/contexts';
import { unitTestAuth } from './auth/auth';
import { integrationTestTRV } from './the-red-village';
import { integrationTestIQPixelsteins } from './iq-pixelsteins';
import { integrationTestExternalRewardWarper } from './external-reward';

baseContext('Unit Tests', function () {
  unitTestAuth();
});

baseContext('Integration Tests', function () {
  integrationTestTRV();
  integrationTestIQPixelsteins();
  integrationTestExternalRewardWarper();
});
