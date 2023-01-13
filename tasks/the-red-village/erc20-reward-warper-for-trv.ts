import { ERC20RewardWarperForTRV__factory } from '../../typechain';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';

task('deploy:trv:erc20-reward-warper-for-trv', 'Deploy the ERC20RewardWarperForTRV contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('rewardPool', 'The address where the reward funds are located at', undefined, types.string, false)
  .setAction(async ({ original, metahub, rewardPool }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying...', { original, metahub });

    await hre.deployments.delete('ERC20RewardWarperForTRV');

    const initData = defaultAbiCoder.encode(['address', 'address', 'address'], [original, metahub, rewardPool]);

    const { address, transactionHash } = await hre.deployments.deploy('ERC20RewardWarperForTRV', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Warper address:', address);

    const instance = new ERC20RewardWarperForTRV__factory(deployer).attach(address);

    return instance;
  });
