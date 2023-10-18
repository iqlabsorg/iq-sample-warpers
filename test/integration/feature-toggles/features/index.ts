import { integrationTestMinimumThreshold } from './minimum-threshold/minimum-threshold';
import { integrationTestZeroBalance } from './zero-balance/zero-balance';

export function integrationTestFeatureControllers(): void {
  integrationTestMinimumThreshold();
  integrationTestZeroBalance();
}
