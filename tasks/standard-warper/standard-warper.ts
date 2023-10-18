import { ADDRESS_ZERO } from '@iqprotocol/iq-space-protocol';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { StandardWarper__factory } from '../../typechain';

task('deploy:standard:standard-warper', 'Deploy the StandardWarper contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('universeRewardAddress', 'The address receiver of universe rewards', undefined, types.string, false)
  .addParam('zeroBalanceCheckAddresses', 'The addresses to check for zero balance', undefined, types.json, false)
  .addParam(
    'allowMultipleRentals',
    'Specifies whether its allowed to rent multiple times',
    undefined,
    types.boolean,
    true,
  )
  .addParam(
    'allowConcurrentRentals',
    'Specifies whether its allowed to rent multiple rentals at the same time',
    undefined,
    types.boolean,
    true,
  )
  .setAction(
    async (
      {
        original,
        metahub,
        universeRewardAddress,
        zeroBalanceCheckAddresses,
        allowMultipleRentals,
        allowConcurrentRentals,
      },
      hre,
    ) => {
      const deployer = await hre.ethers.getNamedSigner('deployer');

      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      console.log('Deploying...', {
        original,
        metahub,
        universeRewardAddress,
        zeroBalanceCheckAddresses,
        allowMultipleRentals,
        allowConcurrentRentals,
      });

      if (universeRewardAddress === ADDRESS_ZERO) {
        const universeRewardSigner = await hre.ethers.getNamedSigner('universeRewardAddress');
        universeRewardAddress = universeRewardSigner.address;
      }

      await hre.deployments.delete('StandardWarper');

      const initData = defaultAbiCoder.encode(
        ['address', 'address', 'address', 'address[]', 'bool', 'bool'],
        [
          original,
          metahub,
          universeRewardAddress,
          zeroBalanceCheckAddresses,
          allowMultipleRentals,
          allowConcurrentRentals,
        ],
      );

      console.log('Warper init data: ', initData);

      const { address, transactionHash } = await hre.deployments.deploy('StandardWarper', {
        from: deployer.address,
        args: [initData],
      });
      console.log('Tx:', transactionHash);
      console.log('Warper address:', address);

      const instance = new StandardWarper__factory(deployer).attach(address);

      return instance;
    },
  );
