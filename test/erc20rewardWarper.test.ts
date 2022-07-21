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
import { Assertion, expect } from 'chai';
import { BigNumber, ContractTransaction } from 'ethers';
import { Rentings } from '@iqprotocol/solidity-contracts-nft/typechain/contracts/metahub/Metahub';

function percentToAllocation(percent: number): number {
  return percent * 100;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Chai {
    interface Eventually {
      equalStruct(expectedStruct: Record<string, any>, message?: string | undefined): AsyncAssertion;
    }
    interface Assertion {
      equalStruct(expectedStruct: Record<string, any>, message?: string | undefined): Assertion;
    }
  }
}

Assertion.addMethod('equalStruct', async function (expectedStruct: Record<string, any>, message?: string) {
  const cleanedUpExpectedStruct = transmuteObject(expectedStruct);
  const cleanedUpStruct = transmuteObject(this._obj);

  // Make sure that the order of keys is persisted!
  new Assertion(Object.keys(cleanedUpStruct)).to.deep.equal(
    Object.keys(cleanedUpExpectedStruct),
    'The order of the keys is not preserved',
  );

  // Make sure that the actual values are equal!
  return new Assertion(cleanedUpStruct).to.deep.equal(cleanedUpExpectedStruct, message);
});

const transmuteSingleObject = (key: string, object: any): any => {
  // the key is not a number (only match "stringy" keys)
  if (!/^\d+$/.test(key)) {
    if (typeof object[key] === 'object') {
      // Special handling for different object classes
      if (object[key] instanceof BigNumber) {
        // BigNumbers don't get transmuted further, return them as-is
        return object[key];
      }
      return transmuteObject(object[key]);
    }
    return object[key];
  }
  return undefined;
};

const transmuteObject = (object: any): Record<string, any> => {
  const cleanedUpStruct: Record<string, any> = {};
  for (const key of Object.keys(object)) {
    const cleanedUpItem = transmuteSingleObject(key, object);
    if (cleanedUpItem !== undefined) {
      cleanedUpStruct[key] = cleanedUpItem;
    }
  }

  return cleanedUpStruct;
};

describe('ERC20RewardWarper', function () {
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
  let authorizedCaller: SignerWithAddress;
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
    [authorizedCaller] = await hre.ethers.getUnnamedSigners();

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
    const multiverseDeployer = await Multiverse.init({
      signer: deployer,
    });
    const multiverseRenter = await Multiverse.init({
      signer: renter,
    });
    chainId = await multiverseDeployer.getChainId();
    const warperSDK = multiverseDeployer.warperManager(
      new AccountId({ chainId, address: infrastructure.warperManager.address }),
    );
    metahubSDK = multiverseRenter.metahub(new AccountId({ chainId, address: metahub.address }));

    // Create a new universe
    const universeRegistry = multiverseDeployer.universeRegistry(
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
    for (const iterator of [...tokensIdsFixedPriceReward, ...tokensIdsFixedPrice]) {
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
    await warperSDK.registerWarper(
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
    await hre.run('metahub:list-tokens', {
      metahub: metahub.address,
      original: originalCollection.address,
      tokens: tokensIdsFixedPriceReward,
      lock: 99604800,
      price: fixedPrice.toString(),
      rewardPercent: listerAllocation,
    });

    await hre.run('metahub:list-tokens', {
      metahub: metahub.address,
      original: originalCollection.address,
      tokens: tokensIdsFixedPrice,
      lock: 99604800,
      price: fixedPrice.toString(),
    });

    // Approve ERC20 tokens
    console.log('minting erc20 tokens to the renter');
    await baseToken.mint(renter.address, parseEther('10000000000'));
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
    it('sets proper universe allocation', async () => {
      await expect(warper.getUniverseAllocation()).to.eventually.equal(universeAllocation);
    });
    it('sets proper protocol allocation', async () => {
      await expect(warper.getProtocolAllocation()).to.eventually.equal(protocolAllocation);
    });
    it('sets proper universe treasury', async () => {
      await expect(warper.getUniverseTreasury()).to.eventually.equal(universeTreasury.address);
    });
    it('sets proper reward pool', async () => {
      await expect(warper.getRewardPool()).to.eventually.equal(rewardPool.address);
    });
  });

  describe('__onRent', () => {
    context('When called by non-Metahub', () => {
      context('called by non-metahub address', () => {
        const emptyRentingAgreement: Rentings.AgreementStruct = {
          warpedAsset: {
            id: { class: '0x00000000', data: '0x' },
            value: BigNumber.from(0),
          },
          listingParams: {
            strategy: '0x00000000',
            data: '0x',
          },
          collectionId: '0x0000000000000000000000000000000000000000000000000000000000000000',
          listingId: BigNumber.from(0),
          renter: ethers.constants.AddressZero,
          startTime: 0,
          endTime: 0,
        };

        it('reverts', async () => {
          await expect(
            warper.__onRent(42, 15, deployer.address, emptyRentingAgreement, {
              protocolEarningToken: baseToken.address,
              protocolEarningValue: parseEther('1').toString(),
              universeEarningToken: baseToken.address,
              universeEarningValue: parseEther('1').toString(),
              universeId: 1,
              userEarnings: [],
            }),
          ).to.be.revertedWith(`CallerIsNotMetahub()`);
        });
      });
    });

    context('When called by Metahub', () => {
      context('When using `FIXED_PRICE` listing strategy', () => {
        let tx: ContractTransaction;
        const rentalPeriod = 100;
        beforeEach(async () => {
          tx = await metahubSDK.rent({
            listingId: 1, // corresponds to token id 1
            maxPaymentAmount: ethers.constants.MaxUint256,
            paymentToken: new AssetType({
              chainId,
              assetName: `erc20:${baseToken.address}`,
            }),
            rentalPeriod: rentalPeriod,
            renter: new AccountId({ chainId, address: renter.address }),
            warper: new AssetType({
              chainId,
              assetName: `erc721:${warper.address}`,
            }),
          });
        });

        it('emits the AllocationsSet event', async () => {
          await expect(tx).to.emit(warper, 'AllocationsSet');
        });

        it('stores the allocation', async () => {
          const allocation = await warper.getAllocation(1);
          expect(allocation).to.equalStruct({
            protocolAllocation: protocolAllocation,
            universeAllocation: universeAllocation,
            listerAllocation: listerAllocation,
            lister: lister.address,
            renter: renter.address,
          });
        });
      });

      context('When using `FIXED_PRICE_WITH_REWARDS` listing strategy', () => {
        let tx: ContractTransaction;
        const rentalPeriod = 100;
        beforeEach(async () => {
          tx = await metahubSDK.rent({
            listingId: 4, // corresponds to token id 4 (tokensIdsFixedPrice[0])
            maxPaymentAmount: ethers.constants.MaxUint256,
            paymentToken: new AssetType({
              chainId,
              assetName: `erc20:${baseToken.address}`,
            }),
            rentalPeriod: rentalPeriod,
            renter: new AccountId({ chainId, address: renter.address }),
            warper: new AssetType({
              chainId,
              assetName: `erc721:${warper.address}`,
            }),
          });
        });

        it('emits the AllocationsSet event', async () => {
          await expect(tx).to.emit(warper, 'AllocationsSet');
        });

        it('stores the allocation', async () => {
          const allocation = await warper.getAllocation(1);
          expect(allocation).to.equalStruct({
            protocolAllocation: protocolAllocation,
            universeAllocation: universeAllocation,
            listerAllocation: 0,
            lister: lister.address,
            renter: renter.address,
          });
        });
      });
    });
  });

  describe('disperseRewards', () => {
    let tx: ContractTransaction;
    const rentalPeriod = 100;
    const listingId = tokensIdsFixedPriceReward[0];
    const tokenId = tokensIdsFixedPriceReward[0];

    const reward = parseEther('1000');
    beforeEach(async () => {
      tx = await metahubSDK.rent({
        listingId: listingId,
        maxPaymentAmount: ethers.constants.MaxUint256,
        paymentToken: new AssetType({
          chainId,
          assetName: `erc20:${baseToken.address}`,
        }),
        rentalPeriod: rentalPeriod,
        renter: new AccountId({ chainId, address: renter.address }),
        warper: new AssetType({
          chainId,
          assetName: `erc721:${warper.address}`,
        }),
      });

      await warper.setAuthorizationStatus(authorizedCaller.address, true);
    });

    context('When called by non-authorized caller', () => {
      it('reverts', async () => {
        await expect(warper.disperseRewards(tokenId, reward, rewardToken.address)).to.be.revertedWith(
          `CallerIsNotAuthorized()`,
        );
      });
    });

    context('When called with a token id with a rental that has not been rented', () => {
      const nonExistentTokenId = 42;
      it('reverts', async () => {
        await expect(
          warper.connect(authorizedCaller).disperseRewards(nonExistentTokenId, reward, rewardToken.address),
        ).to.be.revertedWith(`WinnerIsNotARenter()`);
      });
    });

    context('When dispersed correctly', () => {
      it('transfers correct % of rewards to the protocol', async () => {
        await expect(() =>
          warper.connect(authorizedCaller).disperseRewards(tokenId, reward, rewardToken.address),
        ).to.changeTokenBalance(rewardToken, metahub, reward.mul(protocolAllocation).div(10_000));
      });
      it('transfers correct % of rewards to the universe', async () => {
        await expect(() =>
          warper.connect(authorizedCaller).disperseRewards(tokenId, reward, rewardToken.address),
        ).to.changeTokenBalance(rewardToken, universeTreasury, reward.mul(universeAllocation).div(10_000));
      });
      it('transfers correct % of rewards to the lister', async () => {
        await expect(() =>
          warper.connect(authorizedCaller).disperseRewards(tokenId, reward, rewardToken.address),
        ).to.changeTokenBalance(rewardToken, lister, reward.mul(listerAllocation).div(10_000));
      });
      it('transfers correct % of rewards to the renter', async () => {
        const renterReward = reward
          .sub(reward.mul(listerAllocation).div(10_000))
          .sub(reward.mul(protocolAllocation).div(10_000))
          .sub(reward.mul(universeAllocation).div(10_000));
        await expect(() =>
          warper.connect(authorizedCaller).disperseRewards(tokenId, reward, rewardToken.address),
        ).to.changeTokenBalance(rewardToken, renter, renterReward);
      });
    });
  });
});
