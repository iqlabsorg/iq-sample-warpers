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
import hre from 'hardhat';
import { Auth__factory, MinimumThresholdWarper__factory, MinimumThresholdWarper } from '../../../../../typechain';
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
  LISTING_STRATEGIES,
  EMPTY_BYTES_DATA_HEX,
  AccountId,
  AddressTranslator,
  createAsset,
  makeFixedRateWithRewardTaxTermsFromUnconverted,
  calculateBaseRateInBaseTokenEthers,
  periodValueAndTypeToProtocolConverted,
  PERIOD_TYPE_DAY,
  makeFixedRateWithRewardListingTermsFromUnconverted,
  MetahubAdapter,
} from '@iqprotocol/iq-space-sdk-js';
import { BigNumber, BigNumberish } from 'ethers';
import { calculateListerBaseFee, convertListerBaseFeeToWei } from '../../../../shared/utils/pricing-utils';
import { calculateTaxFeeForFixedRateInWei, SECONDS_IN_DAY } from '../../../../../src';
import { makeSDKListingParams } from '../../../../shared/utils/listing-sdk-utils';
import { makeSDKRentingEstimationParamsERC721 } from '../../../../shared/utils/renting-sdk-utils';
import { expect } from 'chai';

export function testVariousWarperOperations(): void {
  /**** Constants ****/
  const PROTOCOL_RATE_PERCENT = '5';
  const PROTOCOL_REWARD_RATE_PERCENT = '7';
  const LISTER_TOKEN_ID_1 = BigNumber.from(1);
  const LISTER_TOKEN_ID_2 = BigNumber.from(2);
  /**** Config ****/
  let chainId: string;
  /**** Tax Terms ****/
  let protocolTaxTerms: ITaxTermsRegistry.TaxTermsStruct;
  /**** Contracts ****/
  let metahub: IMetahub;
  let listingManager: IListingManager;
  let listingTermsRegistry: IListingTermsRegistry;
  let rentingManager: IRentingManager;
  let taxTermsRegistry: ITaxTermsRegistry;
  let minimumThresholdToken: ERC721Mock;
  let additionalMinimumTresholdToken: ERC721Mock;
  let minimumThresholdWarper: MinimumThresholdWarper;
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
  let universeRewardAddress: SignerWithAddress;
  let stranger: SignerWithAddress;
  /**** SDK ****/
  let metahubAdapter: MetahubAdapter;
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
    minimumThresholdWarper = this.contracts.minimumThreshold.minimumThresholdWarper;
    minimumThresholdToken = this.contracts.minimumThreshold.testThresholdCollection;
    additionalMinimumTresholdToken = (await hre.run('deploy:test:mock:erc721', {
      name: 'Test Additional Minimum Threshold Collection',
      symbol: 'TANFT',
    })) as ERC721Mock;
    /**** Mocks & Samples ****/
    baseToken = this.mocks.assets.baseToken;
    originalCollection = this.mocks.assets.originalCollection;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    universeRewardAddress = this.signers.named.universeRewardAddress;
    [lister, renterA, renterB, universeOwner, stranger] = this.signers.unnamed;

    await minimumThresholdWarper.connect(deployer).transferOwnership(universeOwner.address);
    protocolTaxTerms = makeFixedRateWithRewardTaxTermsFromUnconverted(
      PROTOCOL_RATE_PERCENT,
      PROTOCOL_REWARD_RATE_PERCENT,
    );

    await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(protocolTaxTerms);

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

  context('Renting `MINIMUM THRESHOLD WARPER ` with various cases', () => {
    const MINIMUM_THRESHOLD_WARPER_UNIVERSE_WARPER_RATE_PERCENT = '3.5';
    const MINIMUM_THRESHOLD_WARPER_UNIVERSE_WARPER_REWARD_RATE_PERCENT = '5.9';
    const LISTING_1_BASE_RATE = calculateBaseRateInBaseTokenEthers(
      '0' /*$*/,
      periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_DAY).secondsInProtocolUint32,
    );
    const LISTING_2_BASE_RATE = calculateBaseRateInBaseTokenEthers(
      '1500' /*$*/,
      periodValueAndTypeToProtocolConverted('1', PERIOD_TYPE_DAY).secondsInProtocolUint32,
    );
    const LISTING_1_REWARD_RATE_PERCENT = '0.34'; /*%*/
    const LISTING_2_REWARD_RATE_PERCENT = '53.21'; /*%*/

    let MINIMUM_THRESHOLD_WARPER_UNIVERSE_ID: BigNumberish;
    let universeTaxTerms: ITaxTermsRegistry.TaxTermsStruct;
    let listingTerms_1: IListingTermsRegistry.ListingTermsStruct;
    let listingTerms_2: IListingTermsRegistry.ListingTermsStruct;

    beforeEach(async () => {
      const universeParams = {
        name: 'Minimum Threshold Warper Name',
        paymentTokens: [new AccountId({ chainId, address: baseToken.address })],
      };

      listingTerms_1 = makeFixedRateWithRewardListingTermsFromUnconverted(
        LISTING_1_BASE_RATE,
        LISTING_1_REWARD_RATE_PERCENT,
      );
      listingTerms_2 = makeFixedRateWithRewardListingTermsFromUnconverted(
        LISTING_2_BASE_RATE,
        LISTING_2_REWARD_RATE_PERCENT,
      );

      universeTaxTerms = makeFixedRateWithRewardTaxTermsFromUnconverted(
        MINIMUM_THRESHOLD_WARPER_UNIVERSE_WARPER_RATE_PERCENT,
        MINIMUM_THRESHOLD_WARPER_UNIVERSE_WARPER_REWARD_RATE_PERCENT,
      );

      const setupUniverseTx = await universeWizardV1Adapter.setupUniverseAndRegisterExistingWarper(
        universeParams,
        AddressTranslator.createAssetType(
          new AccountId({ chainId, address: minimumThresholdWarper.address }),
          'erc721',
        ),
        universeTaxTerms,
        {
          name: 'Minimum Threshold Warper',
          universeId: 0, // Unknown before-hand.
          paused: false,
        },
      );
      const newUniverseId = (await universeRegistryAdapter.findUniverseByCreationTransaction(setupUniverseTx.hash))?.id;

      if (!newUniverseId) {
        throw new Error('Universe was not created!');
      } else {
        MINIMUM_THRESHOLD_WARPER_UNIVERSE_ID = newUniverseId;
      }

      await Auth__factory.connect(minimumThresholdWarper.address, universeOwner).setAuthorizationStatus(
        universeOwner.address,
        true,
      );
    });

    it(`works with ${LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD} strategy`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

      const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
        MINIMUM_THRESHOLD_WARPER_UNIVERSE_ID,
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
        listingTerms_1,
      );
      const listingId = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx.hash);
      if (!listingId) {
        throw new Error('Listing was not created!');
      }
      const listingTermsId = (
        await listingTermsRegistry.allListingTerms(
          {
            listingId,
            universeId: MINIMUM_THRESHOLD_WARPER_UNIVERSE_ID,
            warperAddress: minimumThresholdWarper.address,
          },
          0,
          1,
        )
      )[0][0];
      if (!listingTermsId) {
        throw new Error('Listing Terms were not found!');
      }

      await minimumThresholdToken.connect(renterA).mint(renterA.address, 1);

      const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId,
        minimumThresholdWarper.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId,
      );
      const rentalFees = await rentingManagerAdapterA.estimateRent(rentingEstimationParams);

      const expectedListerBaseFee = calculateListerBaseFee(LISTING_1_BASE_RATE, RENTAL_A_PERIOD);
      expect(rentalFees.listerBaseFee).to.be.equal(convertListerBaseFeeToWei(expectedListerBaseFee));
      expect(rentalFees.universeBaseFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, MINIMUM_THRESHOLD_WARPER_UNIVERSE_WARPER_RATE_PERCENT),
      );
      expect(rentalFees.protocolFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, PROTOCOL_RATE_PERCENT),
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

      await expect(rentTx)
        .to.emit(minimumThresholdWarper, 'OnRentHookEvent')
        .withArgs(renterA.address, LISTER_TOKEN_ID_1, rentalId);

      await expect(minimumThresholdWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      await expect(
        MinimumThresholdWarper__factory.connect(minimumThresholdWarper.address, stranger).getLastActiveRentalId(
          renterA.address,
          LISTER_TOKEN_ID_1,
        ),
      ).to.be.eventually.equal(rentalId);
      await expect(
        MinimumThresholdWarper__factory.connect(minimumThresholdWarper.address, stranger).getUniverseRewardAddress(),
      ).to.be.eventually.equal(universeRewardAddress.address);
      const rentalDetails = await MinimumThresholdWarper__factory.connect(
        minimumThresholdWarper.address,
        stranger,
      ).getRentalDetails(rentalId);

      expect(rentalDetails.listingTerms.strategyId).to.be.equal(listingTerms_1.strategyId);
      expect(rentalDetails.listingTerms.strategyData).to.be.equal(listingTerms_1.strategyData);
      expect(rentalDetails.universeTaxTerms.strategyId).to.be.equal(universeTaxTerms.strategyId);
      expect(rentalDetails.universeTaxTerms.strategyData).to.be.equal(universeTaxTerms.strategyData);
      expect(rentalDetails.protocolTaxTerms.strategyId).to.be.equal(protocolTaxTerms.strategyId);
      expect(rentalDetails.protocolTaxTerms.strategyData).to.be.equal(protocolTaxTerms.strategyData);
      expect(rentalDetails.rentalId).to.be.equal(rentalId);
      expect(rentalDetails.listingId).to.be.equal(listingId);
      expect(rentalDetails.lister).to.be.equal(lister.address);

      const minimumThresholds = await MinimumThresholdWarper__factory.connect(
        minimumThresholdWarper.address,
        stranger,
      ).getMinimumThresholds();

      expect(minimumThresholds.requiredCollectionAddresses.length).to.be.equal(1);
      expect(minimumThresholds.requiredCollectionMinimumThresholds.length).to.be.equal(1);
      expect(minimumThresholds.requiredCollectionAddresses[0]).to.be.equal(minimumThresholdToken.address);
      expect(minimumThresholds.requiredCollectionMinimumThresholds[0].toString()).to.be.equal('1');
    });

    it(`works properly with multi-rental, multi-threshold tokens and retrieving reward data`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const LISTING_2_MAX_LOCK_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_B_PERIOD = LISTING_2_MAX_LOCK_PERIOD / 2;
      const REQUIRED_COLLECTION_ADDRESSES = [minimumThresholdToken.address, additionalMinimumTresholdToken.address];
      const REQUIRED_COLLECTION_MINIMUM_THRESHOLDS = [1, 1];

      // Setting minimum threshold tokens
      const setMinimumTresholdsTx = await minimumThresholdWarper
        .connect(universeOwner)
        .setMinimumThresholds(REQUIRED_COLLECTION_ADDRESSES, REQUIRED_COLLECTION_MINIMUM_THRESHOLDS);

      await expect(setMinimumTresholdsTx)
        .to.emit(minimumThresholdWarper, 'MinimumTresholdsSet')
        .withArgs(REQUIRED_COLLECTION_ADDRESSES, REQUIRED_COLLECTION_MINIMUM_THRESHOLDS);

      const minimumThresholds = await MinimumThresholdWarper__factory.connect(
        minimumThresholdWarper.address,
        stranger,
      ).getMinimumThresholds();

      expect(minimumThresholds.requiredCollectionAddresses.length).to.be.equal(REQUIRED_COLLECTION_ADDRESSES.length);
      expect(minimumThresholds.requiredCollectionMinimumThresholds.length).to.be.equal(
        REQUIRED_COLLECTION_MINIMUM_THRESHOLDS.length,
      );
      expect(minimumThresholds.requiredCollectionAddresses[0]).to.be.equal(REQUIRED_COLLECTION_ADDRESSES[0]);
      expect(minimumThresholds.requiredCollectionAddresses[1]).to.be.equal(REQUIRED_COLLECTION_ADDRESSES[1]);
      expect(minimumThresholds.requiredCollectionMinimumThresholds[0].toString()).to.be.equal('1');
      expect(minimumThresholds.requiredCollectionMinimumThresholds[1].toString()).to.be.equal('1');

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        MINIMUM_THRESHOLD_WARPER_UNIVERSE_ID,
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
        listingTerms_1,
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

      await minimumThresholdToken.connect(renterA).mint(renterA.address, 1);
      await additionalMinimumTresholdToken.connect(renterA).mint(renterA.address, 1);

      /**** Listing 2 ****/
      const createListingTx_2 = await listingWizardV1Adapter.createListingWithTerms(
        MINIMUM_THRESHOLD_WARPER_UNIVERSE_ID,
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
        listingTerms_2,
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

      await minimumThresholdToken.connect(renterB).mint(renterB.address, 2);
      await additionalMinimumTresholdToken.connect(renterB).mint(renterB.address, 2);

      /**** Rental A ****/
      const rentingEstimationParams_A = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        minimumThresholdWarper.address,
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
      await expect(rentTx_A)
        .to.emit(minimumThresholdWarper, 'OnRentHookEvent')
        .withArgs(renterA.address, LISTER_TOKEN_ID_1, rentalId_A);
      await expect(minimumThresholdWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      await expect(
        MinimumThresholdWarper__factory.connect(minimumThresholdWarper.address, stranger).getLastActiveRentalId(
          renterA.address,
          LISTER_TOKEN_ID_1,
        ),
      ).to.be.eventually.equal(rentalId_A);

      const rental_A_Details = await MinimumThresholdWarper__factory.connect(
        minimumThresholdWarper.address,
        stranger,
      ).getRentalDetails(rentalId_A);

      expect(rental_A_Details.listingTerms.strategyId).to.be.equal(listingTerms_1.strategyId);
      expect(rental_A_Details.listingTerms.strategyData).to.be.equal(listingTerms_1.strategyData);
      expect(rental_A_Details.universeTaxTerms.strategyId).to.be.equal(universeTaxTerms.strategyId);
      expect(rental_A_Details.universeTaxTerms.strategyData).to.be.equal(universeTaxTerms.strategyData);
      expect(rental_A_Details.protocolTaxTerms.strategyId).to.be.equal(protocolTaxTerms.strategyId);
      expect(rental_A_Details.protocolTaxTerms.strategyData).to.be.equal(protocolTaxTerms.strategyData);
      expect(rental_A_Details.rentalId).to.be.equal(rentalId_A);
      expect(rental_A_Details.listingId).to.be.equal(listingId_1);
      expect(rental_A_Details.lister).to.be.equal(lister.address);

      /**** Rental B ****/
      const rentingEstimationParams_B = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_2,
        minimumThresholdWarper.address,
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
      await expect(rentTx_B)
        .to.emit(minimumThresholdWarper, 'OnRentHookEvent')
        .withArgs(renterB.address, LISTER_TOKEN_ID_2, rentalId_B);
      await expect(minimumThresholdWarper.connect(stranger).ownerOf(LISTER_TOKEN_ID_2)).to.be.eventually.equal(
        renterB.address,
      );
      await expect(
        MinimumThresholdWarper__factory.connect(minimumThresholdWarper.address, stranger).getLastActiveRentalId(
          renterB.address,
          LISTER_TOKEN_ID_2,
        ),
      ).to.be.eventually.equal(rentalId_B);

      const rental_B_Details = await MinimumThresholdWarper__factory.connect(
        minimumThresholdWarper.address,
        stranger,
      ).getRentalDetails(rentalId_B);

      expect(rental_B_Details.listingTerms.strategyId).to.be.equal(listingTerms_2.strategyId);
      expect(rental_B_Details.listingTerms.strategyData).to.be.equal(listingTerms_2.strategyData);
      expect(rental_B_Details.universeTaxTerms.strategyId).to.be.equal(universeTaxTerms.strategyId);
      expect(rental_B_Details.universeTaxTerms.strategyData).to.be.equal(universeTaxTerms.strategyData);
      expect(rental_B_Details.protocolTaxTerms.strategyId).to.be.equal(protocolTaxTerms.strategyId);
      expect(rental_B_Details.protocolTaxTerms.strategyData).to.be.equal(protocolTaxTerms.strategyData);
      expect(rental_B_Details.rentalId).to.be.equal(rentalId_B);
      expect(rental_B_Details.listingId).to.be.equal(listingId_2);
      expect(rental_B_Details.lister).to.be.equal(lister.address);
    });

    it(`reverts when threshold tokens are not on balance`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        MINIMUM_THRESHOLD_WARPER_UNIVERSE_ID,
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
        listingTerms_1,
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

      /**** Rental A ****/
      const rentingEstimationParams_A = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        minimumThresholdWarper.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId_1,
      );
      await expect(rentingManagerAdapterA.estimateRent(rentingEstimationParams_A))
        .to.be.revertedWithCustomError(minimumThresholdWarper, 'AssetIsNotRentable')
        .withArgs('Renter has not enough NFTs from required collections');
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
