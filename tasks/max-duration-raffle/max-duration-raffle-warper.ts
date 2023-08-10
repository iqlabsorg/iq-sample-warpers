import { MaxDurationRaffleWarper__factory } from '../../typechain';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';

task('deploy:max-duration:raffle-warper', 'Deploy the MaxDurationRaffleWarper contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('minDuration', 'Minimum rental duration', undefined, types.int, false)
  .addParam('maxDuration', 'Maximum rental duration', undefined, types.int, false)
  .setAction(async ({ original, metahub, minDuration, maxDuration }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying...', { original, metahub });

    if (!minDuration && !maxDuration && maxDuration - minDuration != 2) {
      throw new Error('Invalid min/max duration');
    }

    await hre.deployments.delete('MaxDurationRaffleWarper');

    const initData = defaultAbiCoder.encode(
      ['address', 'address', 'uint32', 'uint32'],
      [original, metahub, minDuration, maxDuration],
    );

    const { address, transactionHash } = await hre.deployments.deploy('MaxDurationRaffleWarper', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Warper address:', address);

    if (hre.network.name !== 'hardhat') {
      await hre.run('verification:verify', {
        contractName: 'MaxDurationRaffleWarper',
        contractAddress: address,
        constructorArguments: [initData],
        proxyVerification: false,
      });
    }

    return new MaxDurationRaffleWarper__factory(deployer).attach(address);
  });
