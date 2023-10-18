import { integrationTestIntegration } from './integration/integration';
import { integrationTestIntegrationFeatureRegistry } from './integration-feature-registry/integration-feature-registry';
import { integrationTestFeatureControllers } from './features';

export function integrationTestFeatureToggles(): void {
  integrationTestIntegration();
  integrationTestIntegrationFeatureRegistry();
  integrationTestFeatureControllers();
}
