import { defaultAbiCoder } from "ethers/lib/utils";
import { task, types } from "hardhat/config";
import { ERC20RewardWarper__factory } from "../typechain";

task("deploy:warper", "Deploy the warper contract")
  .addParam(
    "original",
    "Original NFT contract address",
    undefined,
    types.string,
    false
  )
  .addParam(
    "metahub",
    "Metahub contract address",
    undefined,
    types.string,
    false
  )
  .addParam(
    "mockTournament",
    "MockTRVTournament address",
    undefined,
    types.string,
    false
  )
  .addParam(
    "mockAllocationResolver",
    "MockAllocationResolver address",
    undefined,
    types.string,
    false
  )
  .addParam(
    "mockMetahub",
    "MockMetahub address",
    undefined,
    types.string,
    false
  )
  .addParam(
    "universeTreasury",
    "TRV treasury address",
    undefined,
    types.string,
    false
  )
  .setAction(
    async (
      {
        original,
        metahub,
        mockTournament,
        mockAllocationResolver,
        mockMetahub,
        universeTreasury,
      },
      hre
    ) => {
      const deployer = await hre.ethers.getNamedSigner("deployer");

      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      console.log("Deploying...", {
        original,
        metahub,
        mockTournament,
        mockAllocationResolver,
        mockMetahub,
        universeTreasury,
      });

      await hre.deployments.delete("ERC20RewardWarper");

      const initData = defaultAbiCoder.encode(
        ["address", "address", "address", "address", "address", "address"],
        [
          original,
          metahub,
          mockTournament,
          mockAllocationResolver,
          mockMetahub,
          universeTreasury,
        ]
      );

      const { address, transactionHash } = await hre.deployments.deploy(
        "ERC20RewardWarper",
        {
          from: deployer.address,
          args: [initData],
        }
      );
      console.log("Tx:", transactionHash);
      console.log("Warper address:", address);

      const instance = new ERC20RewardWarper__factory(deployer).attach(address);

      return instance;
    }
  );
