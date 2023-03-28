import { IQPixelsteinsArsenalWarper__factory } from '../../typechain';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';

task('deploy:iq-pixelsteins:arsenal-warper', 'Deploy the IQPixelsteinsArsenalWarper contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .setAction(async ({ original, metahub }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying...', { original, metahub });

    await hre.deployments.delete('IQPixelsteinsArsenalWarper');

    const initData = defaultAbiCoder.encode(['address', 'address'], [original, metahub]);

    const { address, transactionHash } = await hre.deployments.deploy('IQPixelsteinsArsenalWarper', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Warper address:', address);

    return new IQPixelsteinsArsenalWarper__factory(deployer).attach(address);
  });
