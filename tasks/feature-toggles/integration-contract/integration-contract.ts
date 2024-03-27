import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { Integration__factory } from '../../../typechain';

task('deploy:feature-toggles:integration-contract', 'Deploy the Integration contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('integrationfeatureregistry', 'IntegrationFeatureRegistry contract address', undefined, types.string, false)
  .setAction(async ({ original, metahub, integrationfeatureregistry }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying Integration...', { original, metahub, integrationfeatureregistry });

    await hre.deployments.delete('Integration');

    const initData = defaultAbiCoder.encode(
      ['address', 'address', 'address'],
      [original, metahub, integrationfeatureregistry],
    );

    console.log('Integration init data: ', initData);

    const { address, transactionHash } = await hre.deployments.deploy('Integration', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Integration address:', address);

    if (hre.network.name !== 'hardhat') {
      await hre.run('verification:verify', {
        contractName: 'Integration',
        contractAddress: address,
        constructorArguments: [initData],
        proxyVerification: false,
      });
    }

    const instance = new Integration__factory(deployer).attach(address);

    return instance;
  });
