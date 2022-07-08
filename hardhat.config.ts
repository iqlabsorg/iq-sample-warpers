import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "solidity-coverage";
import "hardhat-deploy";
import "@iqprotocol/solidity-contracts-nft/tasks";

const env = dotenv.config();

import("./tasks").catch(({ message }) =>
  console.log("Cannot load tasks:", message)
);

const DEPLOYMENT_PRIVATE_KEY = env.parsed?.DEPLOYMENT_PRIVATE_KEY;
const accounts = DEPLOYMENT_PRIVATE_KEY ? [DEPLOYMENT_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.15",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
    lister: 1,
    renter: 2,
    metahubTreasury: 3,
    trvTreasury: 4,
  },
  networks: {
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts,
    },
    mumbaiTestnet: {
      url: "https://matic-mumbai.chainstacklabs.com",
      accounts,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  external: {
    contracts: [
      {
        artifacts: "node_modules/@iqprotocol/solidity-contracts-nft/artifacts",
        deploy: "node_modules/@iqprotocol/solidity-contracts-nft/deploy",
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
