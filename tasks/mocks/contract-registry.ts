import { ContractRegistryMock__factory } from '../../typechain';
import { task } from 'hardhat/config';

task('deploy:mock:contract-registry', 'Deploy ContractRegistryMock contract').setAction(async (_, hre) => {
  const deployer = await hre.ethers.getNamedSigner('deployer');

  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  console.log('Deploying...');

  await hre.deployments.delete('ContractRegistryMock');

  const { address, transactionHash } = await hre.deployments.deploy('ContractRegistryMock', {
    from: deployer.address,
    args: [],
  });

  console.log('Tx:', transactionHash);
  console.log('ContractRegistryMock contract address:', address);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return new ContractRegistryMock__factory(deployer).attach(address);
});
