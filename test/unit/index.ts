import { baseContext } from '../shared/contexts';
import { unitTestAuth } from './auth/auth';
import { unitTestERC20RewardWarper } from './erc20-reward-warper/erc20-reward-warper';

baseContext('Unit Tests', function () {
  unitTestAuth();
  unitTestERC20RewardWarper();
});
