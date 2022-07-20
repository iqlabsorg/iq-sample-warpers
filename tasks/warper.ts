import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { ERC20RewardWarper__factory } from '../typechain';

task('deploy:erc20-reward-warper', 'Deploy the erc20-reward-warper contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('universeAllocation', 'Universe allocation (5% = 5 * 10_000 = 50_000)', undefined, types.int, false)
  .addParam('protocolAllocation', 'Protocol allocation (5% = 5 * 10_000 = 50_000)', undefined, types.int, false)
  .addParam(
    'universeTreasury',
    'Universe treasury address (where the rewards % will be transferred to)',
    undefined,
    types.string,
    false,
  )
  .addParam('rewardPool', 'The address where the reward funds are located at', undefined, types.string, false)
  .setAction(
    async ({ original, metahub, universeAllocation, protocolAllocation, universeTreasury, rewardPool }, hre) => {
      const deployer = await hre.ethers.getNamedSigner('deployer');

      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      console.log('Deploying...', {
        original,
        metahub,
        universeAllocation,
        protocolAllocation,
        universeTreasury,
        rewardPool,
      });

      await hre.deployments.delete('ERC20RewardWarper');

      const initData = defaultAbiCoder.encode(
        ['address', 'address', 'uint16', 'uint16', 'address', 'address'],
        [original, metahub, universeAllocation, protocolAllocation, universeTreasury, rewardPool],
      );

      const { address, transactionHash } = await hre.deployments.deploy('ERC20RewardWarper', {
        from: deployer.address,
        args: [initData],
      });
      console.log('Tx:', transactionHash);
      console.log('Warper address:', address);

      const instance = new ERC20RewardWarper__factory(deployer).attach(address);

      return instance;
    },
  );
