import { task, types } from 'hardhat/config';
import { ZeroBalance__factory } from '../../typechain';

task('deploy:zero-balance', 'Deploy the ZeroBalance contract')
  .addParam('integrationFeatureRegistry', 'The address of the IntegrationFeatureRegistry contract', undefined, types.string, false)
  .setAction(async ({ integrationFeatureRegistry }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    console.log('Deploying ZeroBalance with IntegrationFeatureRegistry address:', integrationFeatureRegistry);

    await hre.deployments.delete('ZeroBalance');

    const { address, transactionHash } = await hre.deployments.deploy('ZeroBalance', {
      from: deployer.address,
      args: [integrationFeatureRegistry],
    });

    console.log('Transaction:', transactionHash);
    console.log('ZeroBalance deployed to:', address);

    const instance = new ZeroBalance__factory(deployer).attach(address);

    return instance;
  });
