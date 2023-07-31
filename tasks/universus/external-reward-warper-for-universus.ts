import { ADDRESS_ZERO } from '@iqprotocol/iq-space-protocol';
import { UniversusWarper__factory } from '../../typechain';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';

task('deploy:universus:external-reward-warper-for-universus', 'Deploy the UniversusWarper contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('universeRewardAddress', 'The address receiver of universe rewards', undefined, types.string, false)
  .setAction(async ({ original, metahub, universeRewardAddress }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying...', { original, metahub });

    if (universeRewardAddress === ADDRESS_ZERO) {
      const universeRewardSigner = await hre.ethers.getNamedSigner('universeRewardAddress');
      universeRewardAddress = universeRewardSigner.address;
    }

    await hre.deployments.delete('UniversusWarper');

    const initData = defaultAbiCoder.encode(
      ['address', 'address', 'address'],
      [original, metahub, universeRewardAddress],
    );

    const { address, transactionHash } = await hre.deployments.deploy('UniversusWarper', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Warper address:', address);

    const instance = new UniversusWarper__factory(deployer).attach(address);

    return instance;
  });
