import { ADDRESS_ZERO } from '@iqprotocol/iq-space-protocol';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { BasicIntegration__factory } from '../../typechain';

task('deploy:basic-integration:basic-inegration', 'Deploy the BasicIntegration contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .setAction(async ({ original, metahub }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying...', { original, metahub });

    await hre.deployments.delete('BasicIntegration');

    const initData = defaultAbiCoder.encode(['address', 'address'], [original, metahub]);

    console.log('Warper init data: ', initData);

    const { address, transactionHash } = await hre.deployments.deploy('BasicIntegration', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Warper address:', address);

    const instance = new BasicIntegration__factory(deployer).attach(address);

    return instance;
  });
