import { task, types } from 'hardhat/config';
import { IntegrationFeatureRegistry__factory } from '../../../typechain';

task('deploy:feature-toggles:integration-feature-registry', 'Deploy the IntegrationFeatureRegistry contract')
  .addParam('metahub', 'The Metahub contract', undefined, types.string)
  .addParam('acl', 'The ACL contract address', undefined, types.string)
  .setAction(async ({ metahub, acl }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    await hre.deployments.delete('IntegrationFeatureRegistry');

    console.log('Deploying IntegrationFeatureRegistry...');

    const { address, transactionHash } = await hre.deployments.deploy('IntegrationFeatureRegistry', {
      from: deployer.address,
      args: [metahub, acl],
    });

    console.log('Tx:', transactionHash);
    console.log('IntegrationFeatureRegistry address:', address);

    const instance = new IntegrationFeatureRegistry__factory(deployer).attach(address);

    return instance;
  });
