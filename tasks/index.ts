import { TASK_TEST_SETUP_TEST_ENVIRONMENT } from 'hardhat/builtin-tasks/task-names';
import { subtask } from 'hardhat/config';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

import './warper';
import './auth';
import './mocks';

//eslint-disable-next-line @typescript-eslint/require-await
subtask(TASK_TEST_SETUP_TEST_ENVIRONMENT, async (): Promise<void> => {
  //eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  chai.use(chaiAsPromised);
});
