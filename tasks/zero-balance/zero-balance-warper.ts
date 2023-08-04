import { ADDRESS_ZERO } from '@iqprotocol/iq-space-protocol';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { ZeroBalanceWarper__factory } from '../../typechain';

task('deploy:zero-balance:zero-balance-warper', 'Deploy the ZeroBalanceWarper contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('universeRewardAddress', 'The address receiver of universe rewards', undefined, types.string, false)
  .addParam('zeroBalanceCheckAddresses', 'The addresses to check for zero balance', undefined, types.json, false)
  .setAction(async ({ original, metahub, universeRewardAddress, zeroBalanceCheckAddresses }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying...', { original, metahub });

    if (universeRewardAddress === ADDRESS_ZERO) {
      const universeRewardSigner = await hre.ethers.getNamedSigner('universeRewardAddress');
      universeRewardAddress = universeRewardSigner.address;
    }

    await hre.deployments.delete('ZeroBalanceWarper');

    const initData = defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address[]'],
      [original, metahub, universeRewardAddress, zeroBalanceCheckAddresses],
    );

    console.log('Warper init data: ', initData);

    const { address, transactionHash } = await hre.deployments.deploy('ZeroBalanceWarper', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Warper address:', address);

    const instance = new ZeroBalanceWarper__factory(deployer).attach(address);

    return instance;
  });
