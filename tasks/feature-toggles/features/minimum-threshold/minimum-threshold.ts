import { task, types } from 'hardhat/config';
import { MinimumThreshold__factory } from '../../../../typechain';

task('deploy:features:minimum-threshold', 'Deploy the MinimumThreshold contract')
  .addParam(
    'integrationFeatureRegistry',
    'The address of the IntegrationFeatureRegistry contract',
    undefined,
    types.string,
    false,
  )
  .setAction(async ({ integrationFeatureRegistry }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    console.log('Deploying MinimumThreshold with IntegrationFeatureRegistry address:', integrationFeatureRegistry);

    await hre.deployments.delete('MinimumThreshold');

    const { address, transactionHash } = await hre.deployments.deploy('MinimumThreshold', {
      from: deployer.address,
      args: [integrationFeatureRegistry],
    });

    console.log('Transaction:', transactionHash);
    console.log('MinimumThreshold deployed to:', address);

    const instance = new MinimumThreshold__factory(deployer).attach(address);

    return instance;
  });

//yarn hardhat deploy:minimum-threshold --network $$$ --integrationFeatureRegistry $$$
