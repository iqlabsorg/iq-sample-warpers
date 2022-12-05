/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import hre from 'hardhat';
import { ERC20RewardWarper, ERC20RewardWarper__factory } from '../../../typechain';
import { FakeContract, smock } from '@defi-wonderland/smock';
import { ERC20Mock, ERC721Mock, Metahub, Metahub__factory } from '@iqprotocol/solidity-contracts-nft/typechain';

export async function unitFixtureERC20RewardWarper(): Promise<{
  warper: ERC20RewardWarper;
  metahubMock: FakeContract<Metahub>;
  warperMock: FakeContract<ERC20RewardWarper>;
  baseToken: ERC20Mock;
  rewardToken: ERC20Mock;
  originalCollection: ERC721Mock;
}> {
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

  return {
    warper,
    metahubMock,
    warperMock,
    baseToken,
    rewardToken,
    originalCollection,
  };
}
