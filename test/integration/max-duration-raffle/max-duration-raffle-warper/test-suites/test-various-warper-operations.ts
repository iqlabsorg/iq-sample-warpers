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
  IUniverseWizardV1,
} from '@iqprotocol/iq-space-protocol/typechain';
import {
  IAssetRentabilityMechanics__factory,
  MaxDurationRaffleWarper,
  MaxDurationRaffleWarper__factory,
} from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  ChainId,
  IQSpace,
  ListingManagerAdapter,
  ListingTermsRegistryAdapter,
  ListingWizardAdapterV1,
  RentingManagerAdapter,
  UniverseRegistryAdapter,
  UniverseWizardAdapterV1,
  EMPTY_BYTES_DATA_HEX,
  AccountId,
  AddressTranslator,
  createAsset,
  calculateBaseRateInBaseTokenEthers,
  periodValueAndTypeToProtocolConverted,
  PERIOD_TYPE_DAY,
  makeFixedRateTaxTermsFromUnconverted,
  PERIOD_TYPE_HOUR,
  makeFixedRateListingTermsFromUnconverted,
} from '@iqprotocol/iq-space-sdk-js';
import { BigNumber, BigNumberish } from 'ethers';
import { calculateListerBaseFee, convertListerBaseFeeToWei } from '../../../../shared/utils/pricing-utils';
import { calculateTaxFeeForFixedRateInWei } from '../../../../../src';
import { makeSDKListingParams } from '../../../../shared/utils/listing-sdk-utils';
import { makeSDKRentingEstimationParamsERC721 } from '../../../../shared/utils/renting-sdk-utils';
import { expect } from 'chai';
import { time } from '@nomicfoundation/hardhat-network-helpers';

export function testVariousWarperOperations(): void {
  /**** Constants ****/
  const MIN_RENTAL_PERIOD = BigNumber.from(1000);
  const MAX_RENTAL_PERIOD = BigNumber.from(1000);
  const RENTAL_PERIOD = BigNumber.from(1000);
  const MORE_THAN_RENTAL_PERIOD = BigNumber.from(1001);
  const LESS_THAN_RENTAL_PERIOD = BigNumber.from(999);
  const PROTOCOL_GLOBAL_RATE_PERCENT = '5';
  const PROTOCOL_MAX_DURATION_UNISERSE_RATE_PERCENT = '0';
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
  let maxDurationRaffleWarper: MaxDurationRaffleWarper;
  let listingWizardV1: IListingWizardV1;
  let universeWizardV1: IUniverseWizardV1;
  let universeRegistry: IUniverseRegistry;
  /**** Mocks & Samples ****/
  let baseToken: ERC20Mock;
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
    maxDurationRaffleWarper = this.contracts.maxDuration.maxDurationRaffleWarper;
    /**** Mocks & Samples ****/
    baseToken = this.mocks.assets.baseToken;
    originalCollection = this.mocks.assets.originalCollection;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [lister, renterA, renterB, universeOwner, stranger] = this.signers.unnamed;

    await taxTermsRegistry
      .connect(deployer)
      .registerProtocolGlobalTaxTerms(makeFixedRateTaxTermsFromUnconverted(PROTOCOL_GLOBAL_RATE_PERCENT));

    let iqSpace = await IQSpace.init({ signer: lister });
    listingWizardV1Adapter = iqSpace.listingWizardV1(new AccountId({ chainId, address: listingWizardV1.address }));
    listingManagerAdapter = iqSpace.listingManager(new AccountId({ chainId, address: listingManager.address }));
    listingTermsRegistryAdapter = iqSpace.listingTermsRegistry(
      new AccountId({ chainId, address: listingTermsRegistry.address }),
    );
    iqSpace = await IQSpace.init({ signer: renterA });
    rentingManagerAdapterA = iqSpace.rentingManager(new AccountId({ chainId, address: rentingManager.address }));
    iqSpace = await IQSpace.init({ signer: renterB });
    rentingManagerAdapterB = iqSpace.rentingManager(new AccountId({ chainId, address: rentingManager.address }));
    iqSpace = await IQSpace.init({ signer: universeOwner });
    universeWizardV1Adapter = iqSpace.universeWizardV1(new AccountId({ chainId, address: universeWizardV1.address }));
    universeRegistryAdapter = iqSpace.universeRegistry(new AccountId({ chainId, address: universeRegistry.address }));

    await originalCollection.connect(lister).mint(lister.address, LISTER_TOKEN_ID_1);
    await originalCollection.connect(lister).mint(lister.address, LISTER_TOKEN_ID_2);
    await originalCollection.connect(lister).setApprovalForAll(metahub.address, true);
  });

  context('Renting `Max Duration Raffle Warper` with various cases', () => {
    const MAX_DURATION_RAFFLE_WARPER_RATE_PERCENT = '0';

    let MAX_DURATION_UNIVERSE_ID: BigNumberish;

    beforeEach(async () => {
      const universeParams = {
        name: 'IQ Max Duration Raffle',
        paymentTokens: [new AccountId({ chainId, address: baseToken.address })],
      };

      const setupUniverseTx = await universeWizardV1Adapter.setupUniverseAndRegisterExistingWarper(
        universeParams,
        AddressTranslator.createAssetType(
          new AccountId({ chainId, address: maxDurationRaffleWarper.address }),
          'erc721',
        ),
        makeFixedRateTaxTermsFromUnconverted(MAX_DURATION_RAFFLE_WARPER_RATE_PERCENT),
        {
          name: 'IQ Max Duration Raffle Campaign',
          universeId: 0, // Unknown before-hand.
          paused: false,
        },
      );
      const newUniverseId = (await universeRegistryAdapter.findUniverseByCreationTransaction(setupUniverseTx.hash))?.id;

      if (!newUniverseId) {
        throw new Error('Universe was not created!');
      } else {
        MAX_DURATION_UNIVERSE_ID = newUniverseId;
      }

      await taxTermsRegistry
        .connect(deployer)
        .registerProtocolUniverseTaxTerms(
          MAX_DURATION_UNIVERSE_ID,
          makeFixedRateTaxTermsFromUnconverted(PROTOCOL_MAX_DURATION_UNISERSE_RATE_PERCENT),
        );
    });

    it(`works, when renting one warper`, async () => {
      const LISTING_1_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_1_MAX_LOCK_PERIOD = periodValueAndTypeToProtocolConverted(
        '7',
        PERIOD_TYPE_DAY,
      ).secondsInProtocolUint32;
      const RENTAL_A_PERIOD = RENTAL_PERIOD;

      const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_1.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_1_BASE_RATE),
      );
      const listingId = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx.hash);
      if (!listingId) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId = (
        await listingTermsRegistry.allListingTerms(
          {
            listingId,
            universeId: MAX_DURATION_UNIVERSE_ID,
            warperAddress: maxDurationRaffleWarper.address,
          },
          0,
          1,
        )
      )[0][0];
      if (!listingTermsId) {
        throw new Error('Listing Terms were not found!');
      }

      const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId,
        maxDurationRaffleWarper.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId,
      );
      const rentalFees = await rentingManagerAdapterA.estimateRent(rentingEstimationParams);

      const expectedListerBaseFee = calculateListerBaseFee(LISTING_1_BASE_RATE, RENTAL_A_PERIOD);
      expect(rentalFees.listerBaseFee).to.be.equal(convertListerBaseFeeToWei(expectedListerBaseFee));
      expect(rentalFees.universeBaseFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, MAX_DURATION_RAFFLE_WARPER_RATE_PERCENT),
      );
      expect(rentalFees.protocolFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, PROTOCOL_MAX_DURATION_UNISERSE_RATE_PERCENT),
      );

      await baseToken.connect(renterA).mint(renterA.address, rentalFees.total);
      await baseToken.connect(renterA).increaseAllowance(metahub.address, rentalFees.total);
      const rentTx = await rentingManagerAdapterA.rent({
        ...rentingEstimationParams,
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees.total,
      });
      const rentalId = await findRentalIdByRentTransaction(rentingManager, rentTx.hash);
      if (!rentalId) {
        throw new Error('Rental Agreement was not found!');
      }

      await expect(maxDurationRaffleWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      const rentersCount = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getRentersCount();
      expect(rentersCount).to.be.equalStruct(BigNumber.from(1));
      const totalRentalDurations = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getTotalRentalDurations(0, rentersCount);
      expect([renterA.address]).to.be.deep.equal(totalRentalDurations.renterAddresses);
      expect([BigNumber.from(RENTAL_A_PERIOD)]).to.be.deep.equal(totalRentalDurations.totalRentalDurations);
    });

    it(`works properly with different renter multi-rental`, async () => {
      const LISTING_1_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_2_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_1_MAX_LOCK_PERIOD = periodValueAndTypeToProtocolConverted(
        '7',
        PERIOD_TYPE_DAY,
      ).secondsInProtocolUint32;
      const LISTING_2_MAX_LOCK_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_A_PERIOD = RENTAL_PERIOD;
      const RENTAL_B_PERIOD = RENTAL_PERIOD;

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_1.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_1_BASE_RATE),
      );
      const listingId_1 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_1.hash);
      if (!listingId_1) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId_1 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
        createListingTx_1.hash,
      );
      if (!listingTermsId_1) {
        throw new Error('Listing Terms were not found!');
      }

      /**** Listing 2 ****/
      const createListingTx_2 = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_2.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_2_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_2_BASE_RATE),
      );
      const listingId_2 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_2.hash);
      if (!listingId_2) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId_2 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
        createListingTx_2.hash,
      );
      if (!listingTermsId_2) {
        throw new Error('Listing Terms were not found!');
      }

      /**** Rental A ****/
      const rentingEstimationParams_A = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        maxDurationRaffleWarper.address,
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
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees_A.total,
      });
      const rentalId_A = await findRentalIdByRentTransaction(rentingManager, rentTx_A.hash);
      if (!rentalId_A) {
        throw new Error('Rental Agreement was not found!');
      }
      await expect(maxDurationRaffleWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      let rentersCount = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getRentersCount();
      expect(rentersCount).to.be.equalStruct(BigNumber.from(1));
      let totalRentalDurations = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getTotalRentalDurations(0, rentersCount);
      expect([renterA.address]).to.be.deep.equal(totalRentalDurations.renterAddresses);
      expect([BigNumber.from(RENTAL_A_PERIOD)]).to.be.deep.equal(totalRentalDurations.totalRentalDurations);

      /**** Rental B ****/
      const rentingEstimationParams_B = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_2,
        maxDurationRaffleWarper.address,
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
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees_B.total,
      });
      const rentalId_B = await findRentalIdByRentTransaction(rentingManager, rentTx_B.hash);
      if (!rentalId_B) {
        throw new Error('Rental Agreement was not found!');
      }
      await expect(maxDurationRaffleWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_2)).to.be.eventually.equal(
        renterB.address,
      );
      rentersCount = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getRentersCount();
      expect(rentersCount).to.be.equalStruct(BigNumber.from(2));
      totalRentalDurations = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getTotalRentalDurations(0, rentersCount);
      expect([renterA.address, renterB.address]).to.be.deep.equal(totalRentalDurations.renterAddresses);
      expect([BigNumber.from(RENTAL_A_PERIOD), BigNumber.from(RENTAL_B_PERIOD)]).to.be.deep.equal(
        totalRentalDurations.totalRentalDurations,
      );
    });

    it(`works properly with same renter multi-rental, but not in parallel`, async () => {
      const LISTING_1_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_2_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_1_MAX_LOCK_PERIOD = periodValueAndTypeToProtocolConverted(
        '7',
        PERIOD_TYPE_DAY,
      ).secondsInProtocolUint32;
      const LISTING_2_MAX_LOCK_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_A_PERIOD = RENTAL_PERIOD;
      const RENTAL_B_PERIOD = RENTAL_PERIOD;
      const RENTAL_C_PERIOD = RENTAL_PERIOD;

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_1.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_1_BASE_RATE),
      );
      const listingId_1 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_1.hash);
      if (!listingId_1) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId_1 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
        createListingTx_1.hash,
      );
      if (!listingTermsId_1) {
        throw new Error('Listing Terms were not found!');
      }

      /**** Listing 2 ****/
      const createListingTx_2 = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_2.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_2_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_2_BASE_RATE),
      );
      const listingId_2 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_2.hash);
      if (!listingId_2) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId_2 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
        createListingTx_2.hash,
      );
      if (!listingTermsId_2) {
        throw new Error('Listing Terms were not found!');
      }

      /**** Rental A ****/
      const rentingEstimationParams_A = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        maxDurationRaffleWarper.address,
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
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees_A.total,
      });
      const rentalId_A = await findRentalIdByRentTransaction(rentingManager, rentTx_A.hash);
      if (!rentalId_A) {
        throw new Error('Rental Agreement was not found!');
      }
      await expect(maxDurationRaffleWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      let rentersCount = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getRentersCount();
      expect(rentersCount).to.be.equalStruct(BigNumber.from(1));
      let totalRentalDurations = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getTotalRentalDurations(0, rentersCount);
      expect([renterA.address]).to.be.deep.equal(totalRentalDurations.renterAddresses);
      expect([BigNumber.from(RENTAL_A_PERIOD)]).to.be.deep.equal(totalRentalDurations.totalRentalDurations);

      /**** Skip time ****/
      await time.increase(BigNumber.from(RENTAL_A_PERIOD).toNumber());

      /**** Rental B ****/
      const rentingEstimationParams_B = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_2,
        maxDurationRaffleWarper.address,
        renterA.address,
        RENTAL_B_PERIOD,
        baseToken.address,
        listingTermsId_2,
      );
      const rentalFees_B = await rentingManagerAdapterA.estimateRent(rentingEstimationParams_B);
      await baseToken.connect(renterA).mint(renterA.address, rentalFees_B.total);
      await baseToken.connect(renterA).increaseAllowance(metahub.address, rentalFees_B.total);
      const rentTx_B = await rentingManagerAdapterA.rent({
        ...rentingEstimationParams_B,
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees_B.total,
      });
      const rentalId_B = await findRentalIdByRentTransaction(rentingManager, rentTx_B.hash);
      if (!rentalId_B) {
        throw new Error('Rental Agreement was not found!');
      }
      await expect(maxDurationRaffleWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_2)).to.be.eventually.equal(
        renterA.address,
      );
      rentersCount = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getRentersCount();
      expect(rentersCount).to.be.equalStruct(BigNumber.from(1));
      totalRentalDurations = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getTotalRentalDurations(0, rentersCount);
      expect([renterA.address]).to.be.deep.equal(totalRentalDurations.renterAddresses);
      expect([BigNumber.from(RENTAL_A_PERIOD).add(RENTAL_B_PERIOD)]).to.be.deep.equal(
        totalRentalDurations.totalRentalDurations,
      );

      /**** Skip time ****/
      await time.increase(BigNumber.from(RENTAL_B_PERIOD).toNumber());

      // /**** Rental C ****/
      const rentingEstimationParams_C = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        maxDurationRaffleWarper.address,
        renterA.address,
        RENTAL_C_PERIOD,
        baseToken.address,
        listingTermsId_1,
      );
      const rentalFees_C = await rentingManagerAdapterA.estimateRent(rentingEstimationParams_C);
      await baseToken.connect(renterA).mint(renterA.address, rentalFees_C.total);
      await baseToken.connect(renterA).increaseAllowance(metahub.address, rentalFees_C.total);
      const rentTx_C = await rentingManagerAdapterA.rent({
        ...rentingEstimationParams_C,
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees_C.total,
      });
      const rentalId_C = await findRentalIdByRentTransaction(rentingManager, rentTx_C.hash);
      if (!rentalId_C) {
        throw new Error('Rental Agreement was not found!');
      }
      await expect(maxDurationRaffleWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      rentersCount = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getRentersCount();
      expect(rentersCount).to.be.equalStruct(BigNumber.from(1));
      totalRentalDurations = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getTotalRentalDurations(0, rentersCount);
      expect([renterA.address]).to.be.deep.equal(totalRentalDurations.renterAddresses);
      expect([BigNumber.from(RENTAL_A_PERIOD).add(RENTAL_B_PERIOD).add(RENTAL_C_PERIOD)]).to.be.deep.equal(
        totalRentalDurations.totalRentalDurations,
      );
    });

    it(`fails with same renter multi-rental & in parallel`, async () => {
      const LISTING_1_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_2_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_1_MAX_LOCK_PERIOD = periodValueAndTypeToProtocolConverted(
        '7',
        PERIOD_TYPE_DAY,
      ).secondsInProtocolUint32;
      const LISTING_2_MAX_LOCK_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_A_PERIOD = RENTAL_PERIOD;
      const RENTAL_B_PERIOD = RENTAL_PERIOD;

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_1.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_1_BASE_RATE),
      );
      const listingId_1 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_1.hash);
      if (!listingId_1) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId_1 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
        createListingTx_1.hash,
      );
      if (!listingTermsId_1) {
        throw new Error('Listing Terms were not found!');
      }

      /**** Listing 2 ****/
      const createListingTx_2 = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_2.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_2_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_2_BASE_RATE),
      );
      const listingId_2 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_2.hash);
      if (!listingId_2) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId_2 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
        createListingTx_2.hash,
      );
      if (!listingTermsId_2) {
        throw new Error('Listing Terms were not found!');
      }

      /**** Rental A ****/
      const rentingEstimationParams_A = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        maxDurationRaffleWarper.address,
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
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees_A.total,
      });
      const rentalId_A = await findRentalIdByRentTransaction(rentingManager, rentTx_A.hash);
      if (!rentalId_A) {
        throw new Error('Rental Agreement was not found!');
      }
      await expect(maxDurationRaffleWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      const rentersCount = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getRentersCount();
      expect(rentersCount).to.be.equalStruct(BigNumber.from(1));
      const totalRentalDurations = await MaxDurationRaffleWarper__factory.connect(
        maxDurationRaffleWarper.address,
        stranger,
      ).getTotalRentalDurations(0, rentersCount);
      expect([renterA.address]).to.be.deep.equal(totalRentalDurations.renterAddresses);
      expect([BigNumber.from(RENTAL_A_PERIOD)]).to.be.deep.equal(totalRentalDurations.totalRentalDurations);

      /**** Rental B ****/
      const rentingEstimationParams_B = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_2,
        maxDurationRaffleWarper.address,
        renterA.address,
        RENTAL_B_PERIOD,
        baseToken.address,
        listingTermsId_2,
      );
      rentingManagerAdapterA.estimateRent(rentingEstimationParams_B).catch(console.log);
      // rentingManagerAdapterA.rent({
      //   ...rentingEstimationParams_B,
      //   tokenQuote: EMPTY_BYTES_DATA_HEX,
      //   tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
      //   maxPaymentAmount: 0,
      // }).catch(console.log);
      await expect(
        rentingManagerAdapterA.rent({
          ...rentingEstimationParams_B,
          tokenQuote: EMPTY_BYTES_DATA_HEX,
          tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
          maxPaymentAmount: 0,
        }),
      )
        .to.be.revertedWithCustomError(
          { interface: IAssetRentabilityMechanics__factory.createInterface() },
          'AssetIsNotRentable',
        )
        .withArgs('Asset is already rented!');
    });

    it(`reverts when rental time is more than defined`, async () => {
      const LISTING_1_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_1_MAX_LOCK_PERIOD = periodValueAndTypeToProtocolConverted(
        '7',
        PERIOD_TYPE_DAY,
      ).secondsInProtocolUint32;
      const RENTAL_A_PERIOD = MORE_THAN_RENTAL_PERIOD;

      const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_1.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_1_BASE_RATE),
      );
      const listingId = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx.hash);
      if (!listingId) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId = (
        await listingTermsRegistry.allListingTerms(
          {
            listingId,
            universeId: MAX_DURATION_UNIVERSE_ID,
            warperAddress: maxDurationRaffleWarper.address,
          },
          0,
          1,
        )
      )[0][0];
      if (!listingTermsId) {
        throw new Error('Listing Terms were not found!');
      }

      const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId,
        maxDurationRaffleWarper.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId,
      );

      await expect(rentingManagerAdapterA.estimateRent(rentingEstimationParams))
        .to.be.revertedWithCustomError(maxDurationRaffleWarper, 'WarperRentalPeriodIsOutOfRange')
        .withArgs(RENTAL_A_PERIOD, MIN_RENTAL_PERIOD, MAX_RENTAL_PERIOD);
    });

    it(`reverts when rental time is less than defined`, async () => {
      const LISTING_1_BASE_RATE = calculateBaseRateInBaseTokenEthers(
        '5' /*$*/,
        periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_HOUR).secondsInProtocolUint32,
      );
      const LISTING_1_MAX_LOCK_PERIOD = periodValueAndTypeToProtocolConverted(
        '7',
        PERIOD_TYPE_DAY,
      ).secondsInProtocolUint32;
      const RENTAL_A_PERIOD = LESS_THAN_RENTAL_PERIOD;

      const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
        MAX_DURATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_1.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        makeFixedRateListingTermsFromUnconverted(LISTING_1_BASE_RATE),
      );
      const listingId = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx.hash);
      if (!listingId) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId = (
        await listingTermsRegistry.allListingTerms(
          {
            listingId,
            universeId: MAX_DURATION_UNIVERSE_ID,
            warperAddress: maxDurationRaffleWarper.address,
          },
          0,
          1,
        )
      )[0][0];
      if (!listingTermsId) {
        throw new Error('Listing Terms were not found!');
      }

      const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId,
        maxDurationRaffleWarper.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId,
      );

      await expect(rentingManagerAdapterA.estimateRent(rentingEstimationParams))
        .to.be.revertedWithCustomError(maxDurationRaffleWarper, 'WarperRentalPeriodIsOutOfRange')
        .withArgs(RENTAL_A_PERIOD, MIN_RENTAL_PERIOD, MAX_RENTAL_PERIOD);
    });
  });
}

async function findRentalIdByRentTransaction(
  rentingManager: IRentingManager,
  transactionHash: string,
): Promise<BigNumberish | undefined> {
  const tx = await rentingManager.provider.getTransaction(transactionHash);
  if (!tx.blockHash) {
    return undefined;
  }

  const event = (await rentingManager.queryFilter(rentingManager.filters.AssetRented(), tx.blockHash)).find(
    event => event.transactionHash === transactionHash,
  );

  return event ? event.args.rentalId : undefined;
}
