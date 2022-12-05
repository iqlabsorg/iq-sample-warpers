import { ERC20RewardDistributorMock__factory } from '../../typechain';
import { task, types } from 'hardhat/config';
import { parseEther } from 'ethers/lib/utils';
import { BigNumberish } from 'ethers';

task('deploy:mock:erc20-reward-distributor', 'Deploy ERC20RewardDistributorMock contract')
  .addParam('listingBeneficiary', 'Address of listing beneficiary', undefined, types.string, false)
  .addParam('listingBeneficiaryRewardAmount', 'Reward for listing beneficiary', undefined, types.json, false)
  .addParam('renter', 'Address of renter', undefined, types.string, false)
  .addParam('renterRewardAmount', 'Reward for renter', undefined, types.json, false)
  .addParam('universeId', 'ID of the universe', undefined, types.json, false)
  .addParam('universeRewardAmount', 'Reward for universe', undefined, types.json, false)
  .addParam('protocolRewardAmount', 'Reward for protocol', undefined, types.json, false)
  .setAction(
    async (
      {
        listingBeneficiary,
        listingBeneficiaryRewardAmount,
        renter,
        renterRewardAmount,
        universeId,
        universeRewardAmount,
        protocolRewardAmount,
      }: {
        listingBeneficiary: string;
        listingBeneficiaryRewardAmount: BigNumberish;
        renter: string;
        renterRewardAmount: BigNumberish;
        universeId: BigNumberish;
        universeRewardAmount: BigNumberish;
        protocolRewardAmount: BigNumberish;
      },
      hre,
    ) => {
      const deployer = await hre.ethers.getNamedSigner('deployer');

      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      console.log('Deploying...');

      await hre.deployments.delete('ERC20RewardDistributorMock');

      const { address, transactionHash } = await hre.deployments.deploy('ERC20RewardDistributorMock', {
        from: deployer.address,
        args: [
          listingBeneficiary,
          parseEther(listingBeneficiaryRewardAmount.toString()),
          renter,
          parseEther(renterRewardAmount.toString()),
          universeId,
          parseEther(universeRewardAmount.toString()),
          parseEther(protocolRewardAmount.toString()),
        ],
      });

      console.log('Tx:', transactionHash);
      console.log('ERC20RewardDistributorMock contract address:', address);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return new ERC20RewardDistributorMock__factory(deployer).attach(address);
    },
  );
