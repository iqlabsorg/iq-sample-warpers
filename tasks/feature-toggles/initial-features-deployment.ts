import { task, types } from 'hardhat/config';
import { IntegrationFeatureRegistry, ZeroBalance, MinimumThreshold } from '../../typechain';

task('deploy:initial-features-deployment', 'Deploy feature toggles contracts')
  .addParam('metahub', 'The Metahub contract', undefined, types.string)
  .addParam('acl', 'The ACL contract address', undefined, types.string)
  .setAction(async ({ metahub, acl }, hre) => {
    console.log();
    console.log('############################################################');
    console.log('# Deploying all feature toggles contracts #');
    console.log('############################################################');
    console.log();
    // deploy IntegrationFeatureRegistry
    const integrationFeatureRegistry = (await hre.run('deploy:feature-toggles:integration-feature-registry', {
      metahub: metahub,
      acl: acl,
    })) as IntegrationFeatureRegistry;

    console.log('IntegrationFeatureRegistry contract:', integrationFeatureRegistry.address);

    // Deploy ZeroBalance.sol
    const zeroBalance = (await hre.run('deploy:features:zero-balance', {
      integrationFeatureRegistry: integrationFeatureRegistry.address,
    })) as ZeroBalance;

    console.log('ZeroBalance contrac:', zeroBalance.address);

    // Deploy MinimumThreshold contract
    const minimumThreshold = (await hre.run('deploy:features:minimum-threshold', {
      integrationFeatureRegistry: integrationFeatureRegistry.address,
    })) as MinimumThreshold;

    console.log('MinimumThreshold contract:', minimumThreshold.address);

    return {
      metahub,
      acl,
      integrationFeatureRegistry,
      zeroBalance,
      minimumThreshold,
    };
  });
