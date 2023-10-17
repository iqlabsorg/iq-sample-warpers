import { IntegrationTestIntegration } from './integration/integration';
import { IntegrationTestIntegrationFeatureRegistry } from './integration-feature-registry/integration-feature-registry';


export function integrationTestFeatureToggles(): void {
  IntegrationTestIntegration();
  IntegrationTestIntegrationFeatureRegistry();
}
