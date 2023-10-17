import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { Integration__factory } from '../../typechain';

task('deploy:feature-toggles:integration', 'Deploy the Integration contract')
  .addParam('integrationFeatureRegistry', 'IntegrationFeatureRegistry contract address', undefined, types.string, false)
  .addParam('config', 'Configuration bytes for Integration contract', undefined, types.string, false)
  .setAction(async ({ integrationFeatureRegistry, config }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    console.log('Deploying Integration...', { integrationFeatureRegistry });

    await hre.deployments.delete('Integration');

    const initData = defaultAbiCoder.encode(
      ['address', 'bytes'],
      [integrationFeatureRegistry, config],
    );

    console.log('Integration init data: ', initData);

    const { address, transactionHash } = await hre.deployments.deploy('Integration', {
      from: deployer.address,
      args: [integrationFeatureRegistry, config],
    });
    console.log('Tx:', transactionHash);
    console.log('Integration address:', address);

    const instance = new Integration__factory(deployer).attach(address);

    return instance;
  });

  //yarn hardhat deploy:integration --network polygonMumbaiTestnet --integrationFeatureRegistry 0xfa24a4b96e7d3dfbbafdb9d4d84267e4ba7297469 --config 0x1234567890123456789012345678901234567890123456789012345678901234