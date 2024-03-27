import { ADDRESS_ZERO } from '@iqprotocol/iq-space-protocol';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import { BasicIntegrationWithLimits__factory } from '../../typechain';

task('deploy:basic-integration:basic-inegration-with-limits', 'Deploy the BasicIntegrationWithLimits contract')
  .addParam('original', 'Original NFT contract address', undefined, types.string, false)
  .addParam('metahub', 'Metahub contract address', undefined, types.string, false)
  .addParam('rentalPeriod', 'Rental period duration in seconds', undefined, types.int, false)
  .setAction(async ({ original, metahub, rentalPeriod }, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log('Deploying...', { original, metahub, rentalPeriod });

    await hre.deployments.delete('BasicIntegrationWithLimits');

    const initData = defaultAbiCoder.encode(['address', 'address' , 'uint32'], [original, metahub, rentalPeriod]);

    console.log('Warper init data: ', initData);

    const { address, transactionHash } = await hre.deployments.deploy('BasicIntegrationWithLimits', {
      from: deployer.address,
      args: [initData],
    });
    console.log('Tx:', transactionHash);
    console.log('Warper address:', address);

    const instance = new BasicIntegrationWithLimits__factory(deployer).attach(address);

    return instance;
  });
