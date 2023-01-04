import {
  ERC20Mock, ERC721Mock,
  IListingManager,
  IListingTermsRegistry, IListingWizardV1, IMetahub,
  IRentingManager,
  ITaxTermsRegistry, IUniverseRegistry, IUniverseWizardV1
} from "@iqprotocol/solidity-contracts-nft/typechain";
import {
  Auth__factory,
  ERC20RewardWarperForTRV,
  ERC20RewardWarperForTRV__factory
} from "../../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Asset, AssetId,
  AssetType, ChainId,
  ListingWizardAdapterV1,
  Multiverse, RentingManagerAdapter, UniverseRegistryAdapter,
  UniverseWizardAdapterV1
} from "@iqprotocol/iq-space-sdk-js";
import { ethers, network } from "hardhat";
import { makeTaxTermsFixedRate, makeTaxTermsFixedRateWithReward } from "../../../shared/utils/tax-terms-utils";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { toAccountId } from "../../../shared/utils/sdk-utils";
import {
  EMPTY_BYTES32_DATA_HEX,
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX, HUNDRED_PERCENT,
  LISTING_STRATEGIES
} from "@iqprotocol/solidity-contracts-nft";
import {
  calculateBaseRate,
  calculateListerBaseFee,
  calculateListerBaseFeeInWei, calculateTaxFeeForFixedRateInWei, convertListerBaseFeeToWei,
  convertPercentage
} from "../../../shared/utils/pricing-utils";
import { SECONDS_IN_DAY, SECONDS_IN_HOUR } from "../../../../src/constants";
import {
  makeListingParams,
  makeListingTermsFixedRate,
  makeListingTermsFixedRateWithReward
} from "../../../shared/utils/listing-utils";
import { makeRentingParams, makeSDKRentingEstimationParamsERC721 } from "../../../shared/utils/renting-utils";
import { expect } from "chai";
import { convertToWei } from "../../../shared/utils/general-utils";
import {
  IERC20RewardWarperForTRV
} from "../../../../typechain/contracts/the-red-village/ERC20RewardWarperForTRV";
import { Provider } from "@ethersproject/providers";

export function shouldBehaveLikeERC20RewardWarper(): void {
  /**** Constants ****/
  const PROTOCOL_BASE_TAX_RATE = '5';
  const PROTOCOL_REWARD_TAX_RATE = '7';
  const LISTER_TOKEN_ID_1 = 1;
  const LISTER_TOKEN_ID_2 = 2;
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
  let renter: SignerWithAddress;
  let universeOwner: SignerWithAddress;
  let stranger: SignerWithAddress;
  /**** SDK ****/
  let listingWizardV1Adapter: ListingWizardAdapterV1;
  let rentingManagerAdapter: RentingManagerAdapter;
  let universeWizardV1Adapter: UniverseWizardAdapterV1;
  let universeRegistryAdapter: UniverseRegistryAdapter;

  beforeEach(async function () {
    this.timeout(30000);
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
    [lister, renter, universeOwner, stranger] = this.signers.unnamed;

    await erc20RewardWarperForTRV.connect(deployer).transferOwnership(universeOwner.address);
    await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(
      makeTaxTermsFixedRate(PROTOCOL_BASE_TAX_RATE)
    );
    console.log('AAAA', 6);
    await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(
      makeTaxTermsFixedRateWithReward(PROTOCOL_BASE_TAX_RATE, PROTOCOL_REWARD_TAX_RATE)
    );

    let multiverse = await Multiverse.init({ signer: lister });
    listingWizardV1Adapter = multiverse.listingWizardV1(toAccountId(chainId, listingWizardV1.address));
    multiverse = await Multiverse.init({ signer: renter });
    rentingManagerAdapter = multiverse.rentingManager(toAccountId(chainId, rentingManager.address));
    multiverse = await Multiverse.init({ signer: universeOwner });
    universeWizardV1Adapter = multiverse.universeWizardV1(toAccountId(chainId, universeWizardV1.address));
    universeRegistryAdapter = multiverse.universeRegistry(toAccountId(chainId, universeRegistry.address));

    await originalCollection.connect(lister).mint(lister.address, LISTER_TOKEN_ID_1);
    await originalCollection.connect(lister).mint(lister.address, LISTER_TOKEN_ID_2);
    await originalCollection.connect(lister).setApprovalForAll(metahub.address, true);
  });

  context('Renting `ERC20 Reward Warper for TRV` with various cases', () => {
    const TRV_UNIVERSE_WARPER_BASE_TAX_RATE = '3.5';
    const TRV_UNIVERSE_WARPER_REWARD_TAX_RATE = '5.9';

    let TRV_UNIVERSE_ID: BigNumberish;

    beforeEach(async () => {
      const universeParams = { name: 'The Red Village', paymentTokens: [toAccountId(chainId, baseToken.address)] };

      const setupUniverseTx = await universeWizardV1Adapter.setupUniverseAndWarper(
        universeParams,
        createAssetReference(chainId, 'erc721', erc20RewardWarperForTRV.address),
        makeTaxTermsFixedRateWithReward(TRV_UNIVERSE_WARPER_BASE_TAX_RATE, TRV_UNIVERSE_WARPER_REWARD_TAX_RATE),
        {
          name: 'TRV Warper',
          universeId: 0, // Unknown before-hand.
          paused: false,
        },
        EMPTY_BYTES32_DATA_HEX,
        EMPTY_BYTES_DATA_HEX,
      );
      const newUniverseId = (await universeRegistryAdapter.findUniverseByCreationTransaction(
        setupUniverseTx.hash
      ))?.universeId;

      if (!newUniverseId) {
        throw new Error("Universe was not created!");
      } else {
        TRV_UNIVERSE_ID = newUniverseId;
      }

      await Auth__factory.connect(erc20RewardWarperForTRV.address, universeOwner)
        .setAuthorizationStatus(universeOwner.address, true);
    });

    it(`works with ${LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD} strategy`, async () => {
      const LISTING_1_BASE_RATE = calculateBaseRate("300"/*$*/, SECONDS_IN_DAY);
      const LISTING_1_REWARD = "0" /*%*/;
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

      const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
        TRV_UNIVERSE_ID,
        {
          assets: [makeERC721AssetForSDK(chainId, originalCollection.address, LISTER_TOKEN_ID_1)],
          params: makeListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeListingTermsFixedRateWithReward(LISTING_1_BASE_RATE, LISTING_1_REWARD),
      );
      const listingId = await findListingIdByCreationTransaction(listingManager, createListingTx.hash);
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
        renter.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId,
      );
      const rentalFees = await rentingManagerAdapter.estimateRent(rentingEstimationParams);

      const expectedListerBaseFee = calculateListerBaseFee(LISTING_1_BASE_RATE, RENTAL_A_PERIOD);
      expect(rentalFees.listerBaseFee).to.be.equal(
        convertListerBaseFeeToWei(expectedListerBaseFee),
      );
      expect(rentalFees.universeBaseFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, TRV_UNIVERSE_WARPER_BASE_TAX_RATE),
      );
      expect(rentalFees.protocolFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, PROTOCOL_BASE_TAX_RATE),
      );

      await baseToken.connect(renter).mint(renter.address, rentalFees.total);
      await baseToken.connect(renter).increaseAllowance(metahub.address, rentalFees.total);
      const rentTx = await rentingManagerAdapter.rent({
        ...rentingEstimationParams,
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees.total,
      });
      const rentalId = await findRentalIdByRentTransaction(rentingManager, rentTx.hash);
      if (!rentalId) {
        throw new Error("Rental Agreement was not found!");
      }

      await expect(
        erc20RewardWarperForTRV.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)
      ).to.be.eventually.equal(renter.address);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getTokenRental(renter.address, LISTER_TOKEN_ID_1)
      ).to.be.eventually.equal(rentalId);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getRentalListing(rentalId)
      ).to.be.eventually.equal(listingId);
    });

    it(`works properly with multi-rental and erc20 reward distribution`, async () => {
      const LISTING_1_BASE_RATE = calculateBaseRate("0"/*$*/, SECONDS_IN_DAY);
      const LISTING_2_BASE_RATE = calculateBaseRate("1500"/*$*/, SECONDS_IN_HOUR);
      const LISTING_1_REWARD_RATE = "0.34" /*%*/;
      const LISTING_2_REWARD_RATE = "53.21" /*%*/;
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const LISTING_2_MAX_LOCK_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_B_PERIOD = LISTING_2_MAX_LOCK_PERIOD / 2;

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        TRV_UNIVERSE_ID,
        {
          assets: [makeERC721AssetForSDK(chainId, originalCollection.address, LISTER_TOKEN_ID_1)],
          params: makeListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeListingTermsFixedRateWithReward(LISTING_1_BASE_RATE, LISTING_1_REWARD_RATE),
      );
      const listingId_1 = await findListingIdByCreationTransaction(listingManager, createListingTx_1.hash);
      if (!listingId_1) {
        throw new Error("Listing was not created!");
      }
      const listingTermsId_1 = (await listingTermsRegistry.allListingTerms({
        listingId: listingId_1,
        universeId: TRV_UNIVERSE_ID,
        warperAddress: erc20RewardWarperForTRV.address,
      }, 0, 1))[0][0];
      if (!listingTermsId_1) {
        throw new Error("Listing Terms were not found!");
      }

      /**** Listing 2 ****/
      const createListingTx_2 = await listingWizardV1Adapter.createListingWithTerms(
        TRV_UNIVERSE_ID,
        {
          assets: [makeERC721AssetForSDK(chainId, originalCollection.address, LISTER_TOKEN_ID_2)],
          params: makeListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_2_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeListingTermsFixedRateWithReward(LISTING_2_BASE_RATE, LISTING_2_REWARD_RATE),
      );
      const listingId_2 = await findListingIdByCreationTransaction(listingManager, createListingTx_2.hash);
      if (!listingId_2) {
        throw new Error("Listing was not created!");
      }
      const listingTermsId_2 = (await listingTermsRegistry.allListingTerms({
        listingId: listingId_2,
        universeId: TRV_UNIVERSE_ID,
        warperAddress: erc20RewardWarperForTRV.address,
      }, 0, 1))[0][0];
      if (!listingTermsId_2) {
        throw new Error("Listing Terms were not found!");
      }

      /**** Rental A ****/
      const rentingEstimationParams_A = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        erc20RewardWarperForTRV.address,
        renter.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId_1,
      );
      const rentalFees_A = await rentingManagerAdapter.estimateRent(rentingEstimationParams_A);
      await baseToken.connect(renter).mint(renter.address, rentalFees_A.total);
      await baseToken.connect(renter).increaseAllowance(metahub.address, rentalFees_A.total);
      const rentTx_A = await rentingManagerAdapter.rent({
        ...rentingEstimationParams_A,
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees_A.total,
      });
      const rentalId_A = await findRentalIdByRentTransaction(rentingManager, rentTx_A.hash);
      if (!rentalId_A) {
        throw new Error("Rental Agreement was not found!");
      }
      await expect(
        erc20RewardWarperForTRV.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)
      ).to.be.eventually.equal(renter.address);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getTokenRental(renter.address, LISTER_TOKEN_ID_1)
      ).to.be.eventually.equal(rentalId_A);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getRentalListing(rentalId_A)
      ).to.be.eventually.equal(listingId_1);

      /**** Rental B ****/
      const rentingEstimationParams_B = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_2,
        erc20RewardWarperForTRV.address,
        renter.address,
        RENTAL_B_PERIOD,
        baseToken.address,
        listingTermsId_2,
      );
      const rentalFees_B = await rentingManagerAdapter.estimateRent(rentingEstimationParams_B);
      await baseToken.connect(renter).mint(renter.address, rentalFees_B.total);
      await baseToken.connect(renter).increaseAllowance(metahub.address, rentalFees_B.total);
      const rentTx_B = await rentingManagerAdapter.rent({
        ...rentingEstimationParams_B,
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees_B.total,
      });
      const rentalId_B = await findRentalIdByRentTransaction(rentingManager, rentTx_B.hash);
      if (!rentalId_B) {
        throw new Error("Rental Agreement was not found!");
      }
      await expect(
        erc20RewardWarperForTRV.connect(stranger).ownerOf(LISTER_TOKEN_ID_2)
      ).to.be.eventually.equal(renter.address);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getTokenRental(renter.address, LISTER_TOKEN_ID_2)
      ).to.be.eventually.equal(rentalId_B);
      await expect(
        ERC20RewardWarperForTRV__factory.connect(erc20RewardWarperForTRV.address, stranger)
          .getRentalListing(rentalId_B)
      ).to.be.eventually.equal(listingId_2);

      /**** Join Tournament ****/
      await erc20RewardWarperForTRV.connect(universeOwner)
        .onJoinTournament(1, 1, renter.address, LISTER_TOKEN_ID_1);
      await expect(
        erc20RewardWarperForTRV.connect(stranger)
          .getTournamentParticipant(1, 1, renter.address, LISTER_TOKEN_ID_1)
      ).to.be.eventually.equalStruct(makeTournamentParticipantStruct(listingId_1, rentalId_A));

      await erc20RewardWarperForTRV.connect(universeOwner).onJoinTournament(1, 2, renter.address, LISTER_TOKEN_ID_2);
      await expect(
        erc20RewardWarperForTRV.connect(stranger)
          .getTournamentParticipant(1, 2, renter.address, LISTER_TOKEN_ID_2)
      ).to.be.eventually.equalStruct(makeTournamentParticipantStruct(listingId_2, rentalId_B));

      /**** Distribute for Rental A (while rental is still active) ****/
    });
  })
}

const makeERC721AssetForSDK = (chainId: string, token: string, tokenId: number, value: BigNumberish = 1): Asset => {
  return {
    id: toAssetId(chainId, token, tokenId),
    value,
  };
};

const toAssetId = (chainId: string, collectionAddress: string, tokenId: number): AssetId => {
  return new AssetId(`${chainId}/erc721:${collectionAddress}/${tokenId}`);
};

export const createAssetReference = (chainId: string, namespace: 'erc721' | 'erc20', address: string): AssetType => {
  return new AssetType({
    chainId,
    assetName: { namespace, reference: address },
  });
};

async function findListingIdByCreationTransaction(listingManager: IListingManager, transactionHash: string): Promise<BigNumberish | undefined> {
  const tx = await listingManager.provider.getTransaction(transactionHash);
  if (!tx.blockHash) {
    return undefined;
  }

  const event = (await listingManager.queryFilter(listingManager.filters.ListingCreated(), tx.blockHash)).find(
    event => event.transactionHash === transactionHash,
  );

  return event ? event.args.listingId: undefined;
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

function makeTournamentParticipantStruct(
  listingId: BigNumberish,
  rentalId: BigNumberish,
): IERC20RewardWarperForTRV.TournamentParticipantStruct {
  return {
    rentalId,
    listingId,
  }
}

