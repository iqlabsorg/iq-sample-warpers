import { task, types } from 'hardhat/config';
import { IntegrationFeatureRegistry, ZeroBalance, MinimumThreshold } from '../../typechain';

task('deploy:initial-features-deployment', 'Deploy feature toggles contracts')
  .addParam('metahub', 'The Metahub contract', undefined, types.string)
  .addParam('acl', 'The ACL contract address', undefined, types.string)
  .setAction(async ({ metahub, acl }, hre) => {
    console.log();
    console.log('############################################################');
    console.log('# Deploying all Feature Toggles Contracts #');
    console.log('############################################################');
    console.log();

    // Deploy Feature Toggles Contracts
    const integrationFeatureRegistry = (await hre.run('deploy:feature-toggles:integration-feature-registry', {
      metahub: metahub,
      acl: acl,
    })) as IntegrationFeatureRegistry;

    const zeroBalance = (await hre.run('deploy:features:zero-balance', {
      integrationFeatureRegistry: integrationFeatureRegistry.address,
    })) as ZeroBalance;

    const minimumThreshold = (await hre.run('deploy:features:minimum-threshold', {
      integrationFeatureRegistry: integrationFeatureRegistry.address,
    })) as MinimumThreshold;

    // Verify Feature Toggles Contracts
    if (hre.network.name !== 'hardhat') {
      await hre.run('verification:verify', {
        contractName: 'IntegrationFeatureRegistry',
        contractAddress: integrationFeatureRegistry.address,
        constructorArguments: [metahub, acl],
        proxyVerification: false,
      });

      await hre.run('verification:verify', {
        contractName: 'ZeroBalance',
        contractAddress: zeroBalance.address,
        constructorArguments: [integrationFeatureRegistry.address],
        proxyVerification: false,
      });

      await hre.run('verification:verify', {
        contractName: 'MinimumThreshold',
        contractAddress: minimumThreshold.address,
        constructorArguments: [integrationFeatureRegistry.address],
        proxyVerification: false,
      });
    }

    console.log();
    console.log('############################################################');
    console.log('# All Feature Toggles Contracts deployed successfully #');
    console.log('# IntegrationFeatureRegistry address: ', integrationFeatureRegistry.address);
    console.log('# ZeroBalance Feature address: ', zeroBalance.address);
    console.log('# MinimumThreshold Feature address: ', minimumThreshold.address);
    console.log('############################################################');
    console.log();

    return {
      metahub,
      acl,
      integrationFeatureRegistry,
      zeroBalance,
      minimumThreshold,
    };
  });