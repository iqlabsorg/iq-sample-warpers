import { SolidityInterfaces__factory } from '../../typechain';
import { task } from 'hardhat/config';

task('deploy:mocks:misc:solidity-interfaces', 'Deploy the SolidityInterfaces contract')
  .setAction(async (_args, hre) => {
    const deployer = await hre.ethers.getNamedSigner('deployer');

    await hre.deployments.delete('SolidityInterfaces');

    const { address } = await hre.deployments.deploy('SolidityInterfaces', {
      from: deployer.address,
    });

    return new SolidityInterfaces__factory(deployer).attach(address);
  });
