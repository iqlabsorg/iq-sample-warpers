import { Auth__factory } from '../typechain';
import { task } from 'hardhat/config';

task('deploy:auth', 'Deploy Auth contract').setAction(async (_, hre) => {
  const deployer = await hre.ethers.getNamedSigner('deployer');

  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  console.log('Deploying...');

  await hre.deployments.delete('Auth');

  const { address, transactionHash } = await hre.deployments.deploy('Auth', {
    from: deployer.address,
    args: [],
  });

  console.log('Tx:', transactionHash);
  console.log('Auth contract address:', address);

  return new Auth__factory(deployer).attach(address);
});
