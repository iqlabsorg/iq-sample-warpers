import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import 'hardhat-deploy';
import '@iqprotocol/iq-space-protocol/tasks';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'solidity-coverage';

// Enable custom assertions on project startup
import './test/assertions';
import { IQSpaceV2SupportedChainNetworks } from '@iqprotocol/iq-space-sdk-js';

const env = dotenv.config();

// Enable tasks
// NOTE: https://github.com/dethcrypto/TypeChain/issues/371
import('./tasks').catch((e: string) =>
  console.log(
    `
Cannot load tasks. Need to generate typechain types.
This is the expected behaviour on first time setup.`,
    `Missing type trace: ${e.toString()}`,
  ),
);

const DEPLOYMENT_PRIVATE_KEY = env.parsed?.DEPLOYMENT_PRIVATE_KEY;
const ANKR_PROJECT_KEY = env.parsed?.ANKR_PROJECT_KEY;
const ETHERSCAN_API_KEY_POLYGON = env.parsed?.ETHERSCAN_API_KEY_POLYGON;
const ETHERSCAN_API_KEY_BSC = env.parsed?.ETHERSCAN_API_KEY_BSC;

const accounts = DEPLOYMENT_PRIVATE_KEY ? [DEPLOYMENT_PRIVATE_KEY] : [];
const ankrProjectKey = ANKR_PROJECT_KEY ? ANKR_PROJECT_KEY : '';
const etherscanApiKeyPolygon = ETHERSCAN_API_KEY_POLYGON ? ETHERSCAN_API_KEY_POLYGON : '';
const etherscanApiKeyBsc = ETHERSCAN_API_KEY_BSC ? ETHERSCAN_API_KEY_BSC : '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
  },
  mocha: {
    bail: true,
    timeout: 300000, // more time for tests
  },
  namedAccounts: {
    deployer: 0,
    protocolExternalFeesCollector: 1,
    universeRewardAddress: 2,
  },
  networks: {
    [IQSpaceV2SupportedChainNetworks.POLYGON_MAINNET]: {
      url: `https://rpc.ankr.com/polygon/${ankrProjectKey}`,
      accounts,
      gasPrice: 300_000000000,
      gasMultiplier: 2,
      timeout: 40000,
    },
    [IQSpaceV2SupportedChainNetworks.POLYGON_MUMBAI_TESTNET]: {
      url: `https://rpc.ankr.com/polygon_mumbai/${ankrProjectKey}`,
      accounts,
    },
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      polygon: etherscanApiKeyPolygon,
      polygonMumbai: etherscanApiKeyPolygon,
      bscTestnet: etherscanApiKeyBsc,
    },
    customChains: [],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@iqprotocol/iq-space-protocol/artifacts',
        deploy: 'node_modules/@iqprotocol/iq-space-protocol/deploy',
      },
    ],
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
};

export default config;
