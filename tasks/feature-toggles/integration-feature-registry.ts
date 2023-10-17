import { task } from 'hardhat/config';
import { IntegrationFeatureRegistry__factory } from '../../typechain';

task('deploy:feature-toggles:integration-feature-registry', 'Deploy the IntegrationFeatureRegistry contract')
  .setAction(async (taskArgs, hre) => {
      const deployer = await hre.ethers.getNamedSigner('deployer');

      console.log('Deploying IntegrationFeatureRegistry...');

      const { address, transactionHash } = await hre.deployments.deploy('IntegrationFeatureRegistry', {
        from: deployer.address,
      });

      console.log('Tx:', transactionHash);
      console.log('IntegrationFeatureRegistry address:', address);

      const instance = new IntegrationFeatureRegistry__factory(deployer).attach(address);

      return instance;
    },
  );
