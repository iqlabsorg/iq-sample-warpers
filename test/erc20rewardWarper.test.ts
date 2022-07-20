import hre, { ethers } from 'hardhat';
import {
  ERC20,
  ERC20Mock,
  ERC721Mock,
  Metahub,
  SolidityInterfaces,
  SolidityInterfaces__factory,
} from '@iqprotocol/solidity-contracts-nft/typechain';
import { AccountId, Multiverse, AssetType, MetahubAdapter, ChainId, RentingParams } from '@iqprotocol/multiverse';
import { ERC20RewardWarper } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Fixture } from 'ethereum-waffle';
import { parseEther } from 'ethers/lib/utils';

function percentToAllocation(percent: number): number {
  return percent * 10_000;
}

describe.only('ERC20RewardWarper', function () {
  let metahub: Metahub;
  let warper: ERC20RewardWarper;
  let baseToken: ERC20Mock;
  let rewardToken: ERC20Mock;
  let originalCollection: ERC721Mock;
  let metahubSDK: MetahubAdapter;

  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;
  let renter: SignerWithAddress;
  let protocolTreasury: SignerWithAddress;
  let universeTreasury: SignerWithAddress;
  let rewardPool: SignerWithAddress;
  let stranger: SignerWithAddress;
  let chainId: ChainId;
  let loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
  // Token Related variables
  const tokensIdsFixedPriceReward = [1, 2, 3];
  const tokensIdsFixedPrice = [4, 5];
  const fixedPrice = parseEther('33');

  // Warper Related variables
  const protocolAllocation: number = percentToAllocation(0.5);
  const universeAllocation: number = percentToAllocation(1);
  const listerAllocation: number = percentToAllocation(3.5);

  before(() => {
    loadFixture = hre.waffle.createFixtureLoader();
  });

  async function fixture() {
    deployer = await hre.ethers.getNamedSigner('deployer');
    lister = await hre.ethers.getNamedSigner('lister');
    renter = await hre.ethers.getNamedSigner('renter');

    protocolTreasury = await hre.ethers.getNamedSigner('protocolTreasury');
    universeTreasury = await hre.ethers.getNamedSigner('universeTreasury');
    rewardPool = await hre.ethers.getNamedSigner('rewardPool');
    [stranger] = await hre.ethers.getUnnamedSigners();

    // ------- Metahub start ------- //

    // Deploy & set up metahub
    baseToken = (await hre.run('deploy:mock:ERC20', {
      name: 'Base Token',
      symbol: 'BASE',
    })) as ERC20Mock;
    const infrastructure = await hre.run('deploy:initial-deployment', {
      baseToken: baseToken.address,
      rentalFee: 100,
      unsafe: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    metahub = infrastructure.metahub;

    // Instantiate the SDK
    const multiverse = await Multiverse.init({
      signer: deployer,
    });
    chainId = await multiverse.getChainId();
    metahubSDK = multiverse.metahub(new AccountId({ chainId, address: metahub.address }));

    // Create a new universe
    const universeRegistry = multiverse.universeRegistry(
      new AccountId({
        chainId,
        address: infrastructure.universeRegistry.address,
      }),
    );
    const tx = await universeRegistry.createUniverse({
      name: 'Test Universe',
      rentalFeePercent: universeAllocation,
    });
    const universe = await universeRegistry.findUniverseByCreationTransaction(tx.hash);

    // ------- Warper start ------- //

    // Deploy the original NFT
    originalCollection = (await hre.run('deploy:mock:ERC721', {
      name: 'Original NFT',
    })) as ERC721Mock;

    // Mint the original tokens
    for (const iterator of [...tokensIdsFixedPriceReward, tokensIdsFixedPrice]) {
      await originalCollection.mint(lister.address, iterator);
    }

    // Deploy the warper contract
    warper = (await hre.run('deploy:erc20-reward-warper', {
      original: originalCollection.address,
      metahub: metahub.address,
      universeAllocation: universeAllocation,
      protocolAllocation: protocolAllocation,
      universeTreasury: universeTreasury.address,
      rewardPool: rewardPool.address,
    })) as ERC20RewardWarper;

    // Register the warper
    console.log('registering the warper');
    await metahubSDK.registerWarper(
      new AssetType({
        chainId,
        assetName: `erc721:${warper.address}`,
      }),
      {
        name: 'my-warper',
        universeId: universe!.universeId,
        paused: false,
      },
    );

    // List originals
    await hre.run('metahub:list-tokens-fixed-price', {
      metahub: metahub.address,
      original: originalCollection.address,
      tokens: tokensIdsFixedPrice,
      lock: 99604800,
      price: fixedPrice.toString(),
    });

    // Approve ERC20 tokens
    console.log('minting erc20 tokens to the renter');
    await baseToken.mint(renter.address, parseEther('1000000'));
    console.log('approving erc20 tokens to the metahub');
    await baseToken.connect(renter).approve(metahub.address, ethers.constants.MaxUint256);

    // ------- Reward ERC20 ------- //
    rewardToken = (await hre.run('deploy:mock:ERC20', {
      name: 'Reward token',
      symbol: 'REWARD',
    })) as ERC20Mock;
    await rewardToken.mint(rewardPool.address, parseEther('1000000000'));
    await rewardToken.connect(rewardPool).approve(warper.address, ethers.constants.MaxUint256);
  }

  beforeEach(async () => {
    await loadFixture(fixture);
  });

  describe('constructor', () => {
    it('sets proper universe allocation', () => {

    });
    it('sets proper protocol allocation');
    it('sets proper universe treasury');
    it('sets proper reward pool');
  });

  describe('__onRent', () => {
    context('When called by non-Metahub', () => {
      it('reverts');
    });

    context('When called by Metahub', () => {
      context('When using `FIXED_PRICE` listing strategy', () => {
        it('stores the allocation');
        it('emits an event');
      });

      context('When using `FIXED_PRICE_WITH_REWARDS` listing strategy', () => {
        it('stores the allocation');
        it('emits an event');
      });
    });
  });

  describe('disperseRewards', () => {
    context('When called by non-authorized caller', () => {
      it('reverts');
    });

    context('When called with a token id with a rental that has not been rented', () => {
      it('reverts');
    });

    context('When dispersed correctly', () => {
      it('transfers correct % of rewards to the protocol');
      it('transfers correct % of rewards to the universe');
      it('transfers correct % of rewards to the lister');
      it('transfers correct % of rewards to the renter');
    });
  });
});
