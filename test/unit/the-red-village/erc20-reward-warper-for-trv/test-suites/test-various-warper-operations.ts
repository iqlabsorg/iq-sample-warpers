import {
  ERC20Mock,
  ERC721Mock,
  IListingManager,
  IListingTermsRegistry,
  IListingWizardV1,
  IMetahub,
  IRentingManager,
  ITaxTermsRegistry,
  IUniverseRegistry,
  IUniverseWizardV1
} from "@iqprotocol/solidity-contracts-nft/typechain";
import { Auth__factory, ERC20RewardWarperForTRV, ERC20RewardWarperForTRV__factory } from "../../../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ChainId,
  IQSpace,
  ListingManagerAdapter,
  ListingTermsRegistryAdapter,
  ListingWizardAdapterV1,
  RentingManagerAdapter,
  UniverseRegistryAdapter,
  UniverseWizardAdapterV1,
  calculatePricePerSecondInEthers,
  TAX_STRATEGIES,
  LISTING_STRATEGIES,
  ADDRESS_ZERO,
  EMPTY_BYTES_DATA_HEX,
  HUNDRED_PERCENT_PRECISION_4,
  AccountId,
  AddressTranslator,
  createAsset,
  convertToWei,
  convertPercentage,
  calculateTaxFeeForFixedRateInWei,
} from "@iqprotocol/iq-space-sdk-js";
import { ethers, network } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import {
  calculateListerBaseFee,
  convertListerBaseFeeToWei,
} from "../../../../shared/utils/pricing-utils";
import { SECONDS_IN_DAY, SECONDS_IN_HOUR } from "../../../../../src";
import { makeSDKListingParams } from "../../../../shared/utils/listing-sdk-utils";
import { makeSDKRentingEstimationParamsERC721 } from "../../../../shared/utils/renting-sdk-utils";
import { expect } from "chai";
import { makeTaxTermsFixedRateWithReward } from "../../../../shared/utils/tax-terms-utils";

export function testVariousWarperOperations(): void {
  /**** Constants ****/
  const PROTOCOL_RATE_PERCENT = '5';
  const PROTOCOL_REWARD_RATE_PERCENT = '7';
  const LISTER_TOKEN_ID_1 = BigNumber.from(1);
  const LISTER_TOKEN_ID_2 = BigNumber.from(2);
  /**** Config ****/
  let chainId: string;
  /**** Contracts ****/
  let metahub: IMetahub;
  let listingManager: IListingManager;
  let listingTermsRegistry: IListingTermsRegistry;
  let rentingManager: IRentingManager;
  let taxTermsRegistry: ITaxTermsRegistry;
  let erc20RewardWarperForTRV: ERC20RewardWarperForTRV;
  let listingWizardV1: IListingWizardV1;
  let universeWizardV1: IUniverseWizardV1;
  let universeRegistry: IUniverseRegistry;
  /**** Mocks & Samples ****/
  let baseToken: ERC20Mock;
  let rewardToken: ERC20Mock;
  let originalCollection: ERC721Mock;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;
  let renterA: SignerWithAddress;
  let renterB: SignerWithAddress;
  let universeOwner: SignerWithAddress;
  let stranger: SignerWithAddress;
  /**** SDK ****/
  let listingWizardV1Adapter: ListingWizardAdapterV1;
  let listingManagerAdapter: ListingManagerAdapter;
  let listingTermsRegistryAdapter: ListingTermsRegistryAdapter;
  let rentingManagerAdapterA: RentingManagerAdapter;
  let rentingManagerAdapterB: RentingManagerAdapter;
  let universeWizardV1Adapter: UniverseWizardAdapterV1;
  let universeRegistryAdapter: UniverseRegistryAdapter;

  beforeEach(async function () {
    /**** Config ****/
    chainId = (this.testChainId as ChainId).toString();
    /**** Contracts ****/
    metahub = this.contracts.metahub;
    listingWizardV1 = this.contracts.wizardsV1.listingWizard;
    listingManager = this.contracts.listingManager;
    listingTermsRegistry = this.contracts.listingTermsRegistry;
    universeWizardV1 = this.contracts.wizardsV1.universeWizard;
    universeRegistry = this.contracts.universeRegistry;
    taxTermsRegistry = this.contracts.taxTermsRegistry;
    rentingManager = this.contracts.rentingManager;
    erc20RewardWarperForTRV = this.contracts.theRedVillage.erc20RewardWarperForTRV;
    rewardToken = this.contracts.theRedVillage.rewardToken;
    /**** Mocks & Samples ****/
    baseToken = this.mocks.assets.baseToken;
    originalCollection = this.mocks.assets.originalCollection;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [lister, renterA, renterB, universeOwner, stranger] = this.signers.unnamed;

    await erc20RewardWarperForTRV.connect(deployer).transferOwnership(universeOwner.address);
    await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(
      makeTaxTermsFixedRateWithReward(PROTOCOL_RATE_PERCENT, PROTOCOL_REWARD_RATE_PERCENT)
    );

    let iqSpace = await IQSpace.init({ signer: lister });
    listingWizardV1Adapter = iqSpace.listingWizardV1(new AccountId({chainId, address: listingWizardV1.address}));
    listingManagerAdapter = iqSpace.listingManager(new AccountId({chainId, address: listingManager.address}));
    listingTermsRegistryAdapter = iqSpace.listingTermsRegistry(new AccountId({chainId, address: listingTermsRegistry.address}));
    iqSpace = await IQSpace.init({ signer: renterA });
    rentingManagerAdapterA = iqSpace.rentingManager(new AccountId({chainId, address: rentingManager.address}));
    iqSpace = await IQSpace.init({ signer: renterB });
    rentingManagerAdapterB = iqSpace.rentingManager(new AccountId({chainId, address: rentingManager.address}));
    iqSpace = await IQSpace.init({ signer: universeOwner });
    universeWizardV1Adapter = iqSpace.universeWizardV1(new AccountId({chainId, address: universeWizardV1.address}));
    universeRegistryAdapter = iqSpace.universeRegistry(new AccountId({chainId, address: universeRegistry.address}));

    await originalCollection.connect(lister).mint(lister.address, LISTER_TOKEN_ID_1);
    await originalCollection.connect(lister).mint(lister.address, LISTER_TOKEN_ID_2);
    await originalCollection.connect(lister).setApprovalForAll(metahub.address, true);
  });

  context('Renting `ERC20 Reward Warper for TRV` with various cases', () => {
    const TRV_UNIVERSE_WARPER_RATE_PERCENT = '3.5';
    const TRV_UNIVERSE_WARPER_REWARD_RATE_PERCENT = '5.9';

    let TRV_UNIVERSE_ID: BigNumberish;

    beforeEach(async () => {
      const universeParams = { name: 'The Red Village', paymentTokens: [new AccountId({chainId, address: baseToken.address})] };

      const setupUniverseTx = await universeWizardV1Adapter.setupUniverseAndRegisterExistingWarper(
        universeParams,
        AddressTranslator.createAssetType(new AccountId({chainId, address: erc20RewardWarperForTRV.address}), 'erc721'),
        {
          name: TAX_STRATEGIES.FIXED_RATE_TAX_WITH_REWARD,
          data: {
            ratePercent: TRV_UNIVERSE_WARPER_RATE_PERCENT,
            rewardRatePercent: TRV_UNIVERSE_WARPER_REWARD_RATE_PERCENT,
          },
        },
        {
          name: 'TRV Warper',
          universeId: 0, // Unknown before-hand.
          paused: false,
        },
      );
      const newUniverseId = (await universeRegistryAdapter.findUniverseByCreationTransaction(
        setupUniverseTx.hash
      ))?.id;

      if (!newUniverseId) {
        throw new Error("Universe was not created!");
      } else {
        TRV_UNIVERSE_ID = newUniverseId;
      }

      await Auth__factory.connect(erc20RewardWarperForTRV.address, universeOwner)
        .setAuthorizationStatus(universeOwner.address, true);
      await erc20RewardWarperForTRV.connect(universeOwner).setRewardPool(universeOwner.address);

      // console.log('XXXX', LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD);
    });

    it(`works with ${LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD} strategy`, async () => {
      const LISTING_1_BASE_RATE = calculatePricePerSecondInEthers("300"/*$*/, SECONDS_IN_DAY);
      const LISTING_1_REWARD_RATE_PERCENT = "0" /*%*/;
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

      const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
        TRV_UNIVERSE_ID,
        {
          assets: [createAsset("erc721", new AccountId({chainId, address: originalCollection.address}), LISTER_TOKEN_ID_1.toString())],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        {
          name: LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD,
          data: {
            pricePerSecondInEthers: LISTING_1_BASE_RATE,
            rewardRatePercent: LISTING_1_REWARD_RATE_PERCENT,
          }
        },
      );
      const listingId = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx.hash);
      if (!listingId) {
        throw new Error("Listing was not created!");
      }
      const listingTermsId = (await listingTermsRegistry.allListingTerms({
        listingId,
        universeId: TRV_UNIVERSE_ID,
        warperAddress: erc20RewardWarperForTRV.address,
      }, 0, 1))[0][0];
      if (!listingTermsId) {
        throw new Error("Listing Terms were not found!");
      }

      const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId,
        erc20RewardWarperForTRV.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId,
      );
      const rentalFees = await rentingManagerAdapterA.estimateRent(rentingEstimationParams);

      const expectedListerBaseFee = calculateListerBaseFee(LISTING_1_BASE_RATE, RENTAL_A_PERIOD);
      expect(rentalFees.listerBaseFee).to.be.equal(
        convertListerBaseFeeToWei(expectedListerBaseFee),
      );
      expect(rentalFees.universeBaseFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, TRV_UNIVERSE_WARPER_RATE_PERCENT),
      );
      expect(rentalFees.protocolFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, PROTOCOL_RATE_PERCENT),
      );

      await baseToken.connect(renterA).mint(renterA.address, rentalFees.total);
      await baseToken.connect(renterA).increaseAllowance(metahub.address, rentalFees.total);
      const rentTx = await rentingManagerAdapterA.rent({
        ...rentingEstimationParams,
        tokenQuoteDataEncoded: {
          tokenQuote: EMPTY_BYTES_DATA_HEX,
          tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        },
        maxPaymentAmount: rentalFees.total,
      });
      const rentalId = await findRentalIdByRentTransaction(rentingManager, rentTx.hash);
      if (!rentalId) {
        throw new Error("Rental Agreement was not found!");
      }

      await expect(
        erc20RewardWarperForTRV.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)
      ).to.be.eventually.equal(renterA.address);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getLastActiveRentalId(renterA.address, LISTER_TOKEN_ID_1)
      ).to.be.eventually.equal(rentalId);
    });

    it(`works properly with multi-rental and erc20 reward distribution`, async () => {
      const LISTING_1_BASE_RATE = calculatePricePerSecondInEthers("0"/*$*/, SECONDS_IN_DAY);
      const LISTING_2_BASE_RATE = calculatePricePerSecondInEthers("1500"/*$*/, SECONDS_IN_HOUR);
      const LISTING_1_REWARD_RATE_PERCENT = "0.34" /*%*/;
      const LISTING_2_REWARD_RATE_PERCENT = "53.21" /*%*/;
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const LISTING_2_MAX_LOCK_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_B_PERIOD = LISTING_2_MAX_LOCK_PERIOD / 2;

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        TRV_UNIVERSE_ID,
        {
          assets: [createAsset("erc721", new AccountId({chainId, address: originalCollection.address}), LISTER_TOKEN_ID_1.toString())],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        {
          name: LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD,
          data: {
            pricePerSecondInEthers: LISTING_1_BASE_RATE,
            rewardRatePercent: LISTING_1_REWARD_RATE_PERCENT,
          }
        },
      );
      const listingId_1 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_1.hash);
      if (!listingId_1) {
        throw new Error("Listing was not created!");
      }
      const listingTermsId_1 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(createListingTx_1.hash);
      if (!listingTermsId_1) {
        throw new Error("Listing Terms were not found!");
      }

      /**** Listing 2 ****/
      const createListingTx_2 = await listingWizardV1Adapter.createListingWithTerms(
        TRV_UNIVERSE_ID,
        {
          assets: [createAsset("erc721", new AccountId({chainId, address: originalCollection.address}), LISTER_TOKEN_ID_2.toString())],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_2_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        {
          name: LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD,
          data: {
            pricePerSecondInEthers: LISTING_2_BASE_RATE,
            rewardRatePercent: LISTING_2_REWARD_RATE_PERCENT,
          }
        },
      );
      const listingId_2 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_2.hash);
      if (!listingId_2) {
        throw new Error("Listing was not created!");
      }
      const listingTermsId_2 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(createListingTx_2.hash);
      if (!listingTermsId_2) {
        throw new Error("Listing Terms were not found!");
      }

      /**** Rental A ****/
      const rentingEstimationParams_A = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        erc20RewardWarperForTRV.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId_1,
      );
      const rentalFees_A = await rentingManagerAdapterA.estimateRent(rentingEstimationParams_A);
      await baseToken.connect(renterA).mint(renterA.address, rentalFees_A.total);
      await baseToken.connect(renterA).increaseAllowance(metahub.address, rentalFees_A.total);
      const rentTx_A = await rentingManagerAdapterA.rent({
        ...rentingEstimationParams_A,
        tokenQuoteDataEncoded: {
          tokenQuote: EMPTY_BYTES_DATA_HEX,
          tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        },
        maxPaymentAmount: rentalFees_A.total,
      });
      const rentalId_A = await findRentalIdByRentTransaction(rentingManager, rentTx_A.hash);
      if (!rentalId_A) {
        throw new Error("Rental Agreement was not found!");
      }
      await expect(
        erc20RewardWarperForTRV.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)
      ).to.be.eventually.equal(renterA.address);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getLastActiveRentalId(renterA.address, LISTER_TOKEN_ID_1)
      ).to.be.eventually.equal(rentalId_A);

      /**** Rental B ****/
      const rentingEstimationParams_B = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_2,
        erc20RewardWarperForTRV.address,
        renterB.address,
        RENTAL_B_PERIOD,
        baseToken.address,
        listingTermsId_2,
      );
      const rentalFees_B = await rentingManagerAdapterB.estimateRent(rentingEstimationParams_B);
      await baseToken.connect(renterB).mint(renterB.address, rentalFees_B.total);
      await baseToken.connect(renterB).increaseAllowance(metahub.address, rentalFees_B.total);
      const rentTx_B = await rentingManagerAdapterB.rent({
        ...rentingEstimationParams_B,
        tokenQuoteDataEncoded: {
          tokenQuote: EMPTY_BYTES_DATA_HEX,
          tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        },
        maxPaymentAmount: rentalFees_B.total,
      });
      const rentalId_B = await findRentalIdByRentTransaction(rentingManager, rentTx_B.hash);
      if (!rentalId_B) {
        throw new Error("Rental Agreement was not found!");
      }
      await expect(
        erc20RewardWarperForTRV.connect(stranger).ownerOf(LISTER_TOKEN_ID_2)
      ).to.be.eventually.equal(renterB.address);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getLastActiveRentalId(renterB.address, LISTER_TOKEN_ID_2)
      ).to.be.eventually.equal(rentalId_B);

      /**** Join Tournament ****/
      await erc20RewardWarperForTRV.connect(universeOwner)
        .onJoinTournament(1, 1, renterA.address, LISTER_TOKEN_ID_1);
      expect(
        await erc20RewardWarperForTRV.connect(stranger)
          .getTournamentAssociatedRentalId(1, 1, renterA.address, LISTER_TOKEN_ID_1)
      ).to.equal(rentalId_A);

      await erc20RewardWarperForTRV.connect(universeOwner)
        .onJoinTournament(1, 2, renterB.address, LISTER_TOKEN_ID_2);
      expect(
        await erc20RewardWarperForTRV.connect(stranger)
          .getTournamentAssociatedRentalId(1, 2, renterB.address, LISTER_TOKEN_ID_2)
      ).to.equal(rentalId_B);

      /**** Distribute for Rental A (while rental is still active) ****/
      const REWARD_AMOUNT_A = convertToWei("100");
      await rewardToken.connect(universeOwner).mint(universeOwner.address, REWARD_AMOUNT_A);
      await rewardToken.connect(universeOwner).increaseAllowance(erc20RewardWarperForTRV.address, REWARD_AMOUNT_A);

      const {
        expectedListerFeeFromRewards: expectedListerFeeA,
        expectedRenterFeeFromRewards: expectedRenterFeeA,
        expectedUniverseFeeFromRewards: expectedUniverseFeeA,
        expectedProtocolFeeFromRewards: expectedProtocolFeeA
      } = getExpectedFeesOnERC20RewardDistribution(
        REWARD_AMOUNT_A,
        convertPercentage(LISTING_1_REWARD_RATE_PERCENT),
        convertPercentage(TRV_UNIVERSE_WARPER_REWARD_RATE_PERCENT),
        convertPercentage(PROTOCOL_REWARD_RATE_PERCENT),
      );

      const distributeRewards_TX_A = erc20RewardWarperForTRV.connect(universeOwner).disperseRewards(
        1,
        1,
        LISTER_TOKEN_ID_1,
        REWARD_AMOUNT_A,
        renterA.address,
        rewardToken.address,
      );

      await expect(distributeRewards_TX_A).to.be.fulfilled;
      const receipt_A = await (await distributeRewards_TX_A).wait();
      const events_A = await erc20RewardWarperForTRV.queryFilter(erc20RewardWarperForTRV.filters.RewardsDistributed(), receipt_A.blockNumber);
      const rewardsDistributed_A = events_A[0].args;
      await expect(
        rewardsDistributed_A
      ).to.equalStruct({
        serviceId: 1,
        tournamentId: 1,
        championId: LISTER_TOKEN_ID_1,
        rentalId: rentalId_A,
        renter: renterA.address,
        lister: lister.address,
      });

      await validateResultingAmounts(
        metahub,
        rewardToken,
        lister,
        true,
        renterA,
        TRV_UNIVERSE_ID,
        {
          expectedListerBalance: expectedListerFeeA,
          expectedRenterBalance: expectedRenterFeeA,
          expectedUniverseBalance: expectedUniverseFeeA,
          expectedProtocolBalance: expectedProtocolFeeA,
        },
        true,
        true,
      );
      await expect(
        rewardToken.connect(universeOwner).allowance(universeOwner.address, erc20RewardWarperForTRV.address)
      ).to.eventually.equal(expectedUniverseFeeA);

      /**** Distribute for Rental B (when rental itself is already inactive) ****/
      await network.provider.send('evm_increaseTime', [RENTAL_B_PERIOD * 2]);

      const REWARD_AMOUNT_B = convertToWei("1");
      await rewardToken.connect(universeOwner).mint(universeOwner.address, REWARD_AMOUNT_B);
      await rewardToken.connect(universeOwner).increaseAllowance(erc20RewardWarperForTRV.address, REWARD_AMOUNT_B);

      const {
        expectedListerFeeFromRewards: expectedListerFeeB,
        expectedRenterFeeFromRewards: expectedRenterFeeB,
        expectedUniverseFeeFromRewards: expectedUniverseFeeB,
        expectedProtocolFeeFromRewards: expectedProtocolFeeB
      } = getExpectedFeesOnERC20RewardDistribution(
        REWARD_AMOUNT_B,
        convertPercentage(LISTING_2_REWARD_RATE_PERCENT),
        convertPercentage(TRV_UNIVERSE_WARPER_REWARD_RATE_PERCENT),
        convertPercentage(PROTOCOL_REWARD_RATE_PERCENT),
      );

      const distributeRewards_TX_B = erc20RewardWarperForTRV.connect(universeOwner).disperseRewards(
        1,
        2,
        LISTER_TOKEN_ID_2,
        REWARD_AMOUNT_B,
        renterB.address,
        rewardToken.address,
      );

      await expect(distributeRewards_TX_B).to.be.fulfilled;
      const receipt_B = await (await distributeRewards_TX_B).wait();
      const events_B = await erc20RewardWarperForTRV.queryFilter(erc20RewardWarperForTRV.filters.RewardsDistributed(), receipt_B.blockNumber);
      const rewardsDistributed_B = events_B[0].args;
      await expect(
        rewardsDistributed_B
      ).to.equalStruct({
        serviceId: 1,
        tournamentId: 2,
        championId: LISTER_TOKEN_ID_2,
        rentalId: rentalId_B,
        renter: renterB.address,
        lister: lister.address,
      });

      await validateResultingAmounts(
        metahub,
        rewardToken,
        lister,
        true,
        renterB,
        TRV_UNIVERSE_ID,
        {
          expectedListerBalance: BigNumber.from(expectedListerFeeB).add(expectedListerFeeA),
          expectedRenterBalance: expectedRenterFeeB,
          expectedUniverseBalance: BigNumber.from(expectedUniverseFeeB).add(expectedUniverseFeeA),
          expectedProtocolBalance: BigNumber.from(expectedProtocolFeeB).add(expectedProtocolFeeA),
        },
        true,
        true,
      );
      await expect(
        rewardToken.connect(universeOwner).allowance(universeOwner.address, erc20RewardWarperForTRV.address)
      ).to.eventually.equal(BigNumber.from(expectedUniverseFeeA).add(expectedUniverseFeeB));
    });

    it("does not distribute rewards, when tournament participant does not exist", async () => {
      await expect(
        erc20RewardWarperForTRV.connect(universeOwner).disperseRewards(
          1,
          1,
          1,
          0,
          ADDRESS_ZERO,
          ADDRESS_ZERO,
        ),
      ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, "ParticipantDoesNotExist");
    });
  })
}

async function findRentalIdByRentTransaction(rentingManager: IRentingManager, transactionHash: string): Promise<BigNumberish | undefined> {
  const tx = await rentingManager.provider.getTransaction(transactionHash);
  if (!tx.blockHash) {
    return undefined;
  }

  const event = (await rentingManager.queryFilter(rentingManager.filters.AssetRented(), tx.blockHash)).find(
    event => event.transactionHash === transactionHash,
  );

  return event ? event.args.rentalId: undefined;
}

export function getExpectedFeesOnERC20RewardDistribution(
  rewardAmount: BigNumberish,
  listerFeeRewardPercentConverted: BigNumberish = 0,
  universeFeeRewardPercentConverted: BigNumberish = 0,
  protocolFeeRewardPercentConverted: BigNumberish = 0,
): {
  expectedListerFeeFromRewards: BigNumberish;
  expectedRenterFeeFromRewards: BigNumberish;
  expectedUniverseFeeFromRewards: BigNumberish;
  expectedProtocolFeeFromRewards: BigNumberish;
} {
  let leftover = BigNumber.from(rewardAmount);

  let expectedUniverseFee = BigNumber.from(rewardAmount).mul(universeFeeRewardPercentConverted).div(HUNDRED_PERCENT_PRECISION_4);
  if (BigNumber.from(leftover).lte(expectedUniverseFee)) {
    expectedUniverseFee = BigNumber.from(leftover);
    leftover = BigNumber.from(0);
  } else {
    leftover = BigNumber.from(leftover).sub(expectedUniverseFee);
  }

  let expectedProtocolFee = BigNumber.from(leftover).mul(protocolFeeRewardPercentConverted).div(HUNDRED_PERCENT_PRECISION_4);
  if (BigNumber.from(leftover).lte(expectedProtocolFee)) {
    expectedProtocolFee = BigNumber.from(leftover);
    leftover = BigNumber.from(0);
  } else {
    leftover = BigNumber.from(leftover).sub(expectedProtocolFee);
  }

  let expectedListerFee = BigNumber.from(leftover).mul(listerFeeRewardPercentConverted).div(HUNDRED_PERCENT_PRECISION_4);
  if (BigNumber.from(leftover).lte(expectedListerFee)) {
    expectedListerFee = BigNumber.from(leftover);
    leftover = BigNumber.from(0);
  } else {
    leftover = BigNumber.from(leftover).sub(expectedListerFee);
  }
  const expectedRenterFee = leftover;

  return { expectedListerFeeFromRewards: expectedListerFee, expectedRenterFeeFromRewards: expectedRenterFee, expectedUniverseFeeFromRewards: expectedUniverseFee, expectedProtocolFeeFromRewards: expectedProtocolFee };
}

export async function validateResultingAmounts(
  metahub: IMetahub,
  rewardToken: ERC20Mock,
  lister: SignerWithAddress,
  listingHasImmediatePayout: boolean,
  renter: SignerWithAddress,
  universeId: BigNumberish,
  expectedBalances: {
    expectedListerBalance: BigNumberish;
    expectedRenterBalance: BigNumberish;
    expectedUniverseBalance: BigNumberish;
    expectedProtocolBalance: BigNumberish;
  },
  universeDidNotReceiveRewardsDirectly = false,
  protocolReceivedFeesExternally = false
): Promise<void> {
  const { expectedListerBalance, expectedRenterBalance, expectedUniverseBalance, expectedProtocolBalance } =
    expectedBalances;

  if (listingHasImmediatePayout) {
    await expect(rewardToken.balanceOf(lister.address)).to.eventually.eq(expectedListerBalance);
  } else {
    await expect(metahub.balance(lister.address, rewardToken.address)).to.eventually.eq(expectedListerBalance);
  }

  await expect(metahub.balance(renter.address, rewardToken.address)).to.eventually.eq(0);
  await expect(rewardToken.balanceOf(renter.address)).to.eventually.eq(expectedRenterBalance);

  if (protocolReceivedFeesExternally) {
    await expect(
      rewardToken.balanceOf((await ethers.getNamedSigner("protocolExternalFeesCollector")).address)
    ).to.eventually.eq(expectedProtocolBalance);
  } else {
    await expect(metahub.protocolBalance(rewardToken.address)).to.eventually.eq(expectedProtocolBalance);
  }
  if (!universeDidNotReceiveRewardsDirectly) {
    await expect(metahub.universeBalance(universeId, rewardToken.address)).to.eventually.eq(expectedUniverseBalance);
  }
}

