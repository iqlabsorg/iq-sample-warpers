import { baseContext } from '../shared/contexts';
import { unitTestAuth } from './auth/auth';
import { unitTestTRV } from './the-red-village';

baseContext('Unit Tests', function () {
  unitTestAuth();
});

baseContext('Integration Tests', function () {
  unitTestTRV();
});
