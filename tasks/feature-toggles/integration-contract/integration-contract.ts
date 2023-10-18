import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { Integration__factory } from '../../../typechain';

task('deploy:feature-toggles:integration-contract', 'Deploy the Integration contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('universeRewardAddress', 'The address receiver of universe rewards', undefined, types.string, false)
  .addParam('integrationFeatureRegistry', 'IntegrationFeatureRegistry contract address', undefined, types.string, false)
  .setAction(async ({ original, metahub, universeRewardAddress, integrationFeatureRegistry }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying Integration...', { original, metahub, universeRewardAddress, integrationFeatureRegistry });

    await hre.deployments.delete('Integration');

    const initData = defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address'],
      [original, metahub, universeRewardAddress, integrationFeatureRegistry],
    );

    console.log('Integration init data: ', initData);

    const { address, transactionHash } = await hre.deployments.deploy('Integration', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Integration address:', address);

    const instance = new Integration__factory(deployer).attach(address);

    return instance;
  });
