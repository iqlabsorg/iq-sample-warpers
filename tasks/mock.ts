import { task, types } from "hardhat/config";
import {
  MockAllocationResolver__factory,
  MockMetahub__factory,
  MockTournament__factory,
  MockTRVTournament__factory,
  MockTRVCollection__factory,
} from "../typechain";

task("deploy:mock-tournament", "Deploy MockTournament contract").setAction(
  async ({}, hre) => {
    const deployer = await hre.ethers.getNamedSigner("deployer");

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log("Deploying...");

    await hre.deployments.delete("MockTournament");

    const { address, transactionHash } = await hre.deployments.deploy(
      "MockTournament",
      {
        from: deployer.address,
        args: [],
      }
    );

    console.log("Tx:", transactionHash);
    console.log("MockTournament contract address:", address);

    return new MockTournament__factory(deployer).attach(address);
  }
);

task(
  "deploy:mock-allocation-resolver",
  "Deploy MockAllocationResolver contract"
).setAction(async ({}, hre) => {
  const deployer = await hre.ethers.getNamedSigner("deployer");

  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  console.log("Deploying...");

  await hre.deployments.delete("MockAllocationResolver");

  const { address, transactionHash } = await hre.deployments.deploy(
    "MockAllocationResolver",
    {
      from: deployer.address,
      args: [],
    }
  );

  console.log("Tx:", transactionHash);
  console.log("MockAllocationResolver contract address:", address);

  return new MockAllocationResolver__factory(deployer).attach(address);
});

task("deploy:mock-metahub", "Deploy MockMetahub contract")
  .addParam(
    "treasuryAddress",
    "Metahub treasury address",
    undefined,
    types.string,
    false
  )
  .setAction(async ({ treasuryAddress }, hre) => {
    const deployer = await hre.ethers.getNamedSigner("deployer");

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log("Deploying...", { treasuryAddress });

    await hre.deployments.delete("MockMetahub");

    const { address, transactionHash } = await hre.deployments.deploy(
      "MockMetahub",
      {
        from: deployer.address,
        args: [treasuryAddress],
      }
    );

    console.log("Tx:", transactionHash);
    console.log("MockMetahub contract address:", address);

    return new MockMetahub__factory(deployer).attach(address);
  });

task("deploy:mock-trv-tournament", "Deploy MockTRVTournament contract")
  .addParam(
    "rewardTokenAddress",
    "TRV tournament ERC20 reward token",
    undefined,
    types.string,
    false
  )
  .setAction(async ({ rewardTokenAddress }, hre) => {
    const deployer = await hre.ethers.getNamedSigner("deployer");

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log("Deploying...", { rewardTokenAddress });

    await hre.deployments.delete("MockTRVTournament");

    const { address, transactionHash } = await hre.deployments.deploy(
      "MockTRVTournament",
      {
        from: deployer.address,
        args: [rewardTokenAddress],
      }
    );

    console.log("Tx:", transactionHash);
    console.log("MockTRVTournament contract address:", address);

    return new MockTRVTournament__factory(deployer).attach(address);
  });

task("deploy:mock-trv-collection", "Deploy MockTRVCollection contract")
  .addParam(
    "name",
    "Mocked TRV NFT collection name",
    undefined,
    types.string,
    false
  )
  .addParam(
    "symbol",
    "Mocked TRV NFT collection symbol",
    undefined,
    types.string,
    false
  )
  .addParam(
    "totalSupply",
    "Mocked TRV NFT total supply",
    undefined,
    types.int,
    false
  )
  .setAction(async ({ name, symbol, totalSupply }, hre) => {
    const deployer = await hre.ethers.getNamedSigner("deployer");

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    console.log("Deploying...", { name, symbol, totalSupply });

    await hre.deployments.delete("MockTRVCollection");

    const { address, transactionHash } = await hre.deployments.deploy(
      "MockTRVCollection",
      {
        from: deployer.address,
        args: [name, symbol, totalSupply],
      }
    );

    console.log("Tx:", transactionHash);
    console.log("MockTRVCollection contract address:", address);

    return new MockTRVCollection__factory(deployer).attach(address);
  });
