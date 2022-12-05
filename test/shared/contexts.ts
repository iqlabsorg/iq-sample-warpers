/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import hre, { ethers } from 'hardhat';
import { smock } from '@defi-wonderland/smock';
import { ERC20Mock, ERC721Mock, Metahub } from '@iqprotocol/solidity-contracts-nft/typechain';
import { Metahub__factory } from '@iqprotocol/solidity-contracts-nft/typechain/factories/contracts/metahub/Metahub__factory';
import { ERC20RewardWarper__factory, Auth, ContractRegistryMock, ERC20RewardWarper } from '../../typechain';
import type { Contracts, Mocks, Signers } from './types';

// eslint-disable-next-line func-style
export function baseContext(description: string, testSuite: () => void): void {
  describe(description, function () {
    before(async function () {
      this.contracts = {} as Contracts;
      this.mocks = {
        assets: {},
      } as Mocks;
      this.signers = {} as Signers;

      // Signer setup
      this.signers.named = await ethers.getNamedSigners();
      this.signers.unnamed = await ethers.getUnnamedSigners();

      // Fixture loader setup
      this.loadFixture = hre.waffle.createFixtureLoader();

      // Auth deployment
      const auth = (await hre.run('deploy:auth')) as Auth;

      // ContractRegistryMock deployment
      const contractRegistryMock = (await hre.run('deploy:mock:contract-registry')) as ContractRegistryMock;
      // FakeMetahub deployment
      const metahubMock = await smock.fake<Metahub>(Metahub__factory);
      // Base ERC20 Base Token deployment
      const baseToken = (await hre.run('deploy:mock:ERC20', {
        name: 'Base Token',
        symbol: 'BASE',
      })) as ERC20Mock;
      // Base ERC20 Reward Token deployment
      const rewardToken = (await hre.run('deploy:mock:ERC20', {
        name: 'Reward Token',
        symbol: 'RWRD',
      })) as ERC20Mock;
      // Original ERC721 Asset deployment
      const originalCollection = (await hre.run('deploy:mock:ERC721', {
        name: 'Original NFT',
      })) as ERC721Mock;
      // ERC20RewardWarper deployment
      const warper = (await hre.run('deploy:erc20-reward-warper', {
        original: originalCollection.address,
        metahub: metahubMock.address,
      })) as ERC20RewardWarper;
      // FakeMetahub deployment
      const warperMock = await smock.fake<ERC20RewardWarper>(ERC20RewardWarper__factory);

      this.contracts.auth = auth;
      this.contracts.warper = warper;
      this.mocks.contractRegistry = contractRegistryMock;
      this.mocks.warper = warperMock;
      this.mocks.metahub = metahubMock;
      this.mocks.assets.originalCollection = originalCollection;
      this.mocks.assets.baseToken = baseToken;
      this.mocks.assets.rewardToken = rewardToken;
    });

    testSuite();
  });
}
