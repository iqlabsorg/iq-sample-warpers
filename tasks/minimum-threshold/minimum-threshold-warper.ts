import { ADDRESS_ZERO } from '@iqprotocol/iq-space-protocol';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { MinimumThresholdWarper__factory } from '../../typechain';

task('deploy:minimum-threshold:minimum-threshold-warper', 'Deploy the MinimumThresholdWarper contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('universeRewardAddress', 'The address receiver of universe rewards', undefined, types.string, false)
  .addParam(
    'requiredCollectionAddresses',
    'The addresses of the collections that are required',
    undefined,
    types.json,
    false,
  )
  .addParam(
    'requiredMinimumCollectionAmountThresholds',
    'The minimum amount of NFTs that are required for each collection',
    undefined,
    types.json,
    false,
  )
  .setAction(
    async (
      {
        original,
        metahub,
        universeRewardAddress,
        requiredCollectionAddresses,
        requiredMinimumCollectionAmountThresholds,
      },
      hre,
    ) => {
      const deployer = await hre.ethers.getNamedSigner('deployer');

      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      console.log('Deploying...', { original, metahub });

      if (universeRewardAddress === ADDRESS_ZERO) {
        const universeRewardSigner = await hre.ethers.getNamedSigner('universeRewardAddress');
        universeRewardAddress = universeRewardSigner.address;
      }

      await hre.deployments.delete('MinimumThresholdWarper');

      const initData = defaultAbiCoder.encode(
        ['address', 'address', 'address', 'address[]', 'uint256[]'],
        [
          original,
          metahub,
          universeRewardAddress,
          requiredCollectionAddresses,
          requiredMinimumCollectionAmountThresholds,
        ],
      );

      console.log('Warper init data: ', initData);

      const { address, transactionHash } = await hre.deployments.deploy('MinimumThresholdWarper', {
        from: deployer.address,
        args: [initData],
      });
      console.log('Tx:', transactionHash);
      console.log('Warper address:', address);

      const instance = new MinimumThresholdWarper__factory(deployer).attach(address);

      return instance;
    },
  );
