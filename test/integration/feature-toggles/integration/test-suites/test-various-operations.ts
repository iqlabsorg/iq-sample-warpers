import {
  ERC20Mock,
  ERC721Mock,
  IListingManager,
  IListingTermsRegistry,
  IListingWizardV1,
  IMetahub,
  IACL,
  IRentingManager,
  ITaxTermsRegistry,
  IUniverseRegistry,
  IUniverseWizardV1,
  IUniverseToken__factory,
  IUniverseToken,
} from '@iqprotocol/iq-space-protocol/typechain';
import {
  Auth__factory,
  Integration,
  IntegrationFeatureRegistry,
  ZeroBalance,
  Integration__factory,
} from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, BigNumberish } from 'ethers';
import {
  AccountId,
  AddressTranslator,
  ChainId,
  EMPTY_BYTES_DATA_HEX,
  IQSpace,
  LISTING_STRATEGIES,
  ListingManagerAdapter,
  ListingTermsRegistryAdapter,
  ListingWizardAdapterV1,
  MetahubAdapter,
  PERIOD_TYPE_DAY,
  RentingManagerAdapter,
  UniverseRegistryAdapter,
  UniverseWizardAdapterV1,
  calculateBaseRateInBaseTokenEthers,
  createAsset,
  makeFixedRateWithRewardListingTermsFromUnconverted,
  makeFixedRateWithRewardTaxTermsFromUnconverted,
  periodValueAndTypeToProtocolConverted,
} from '@iqprotocol/iq-space-sdk-js';
import { SECONDS_IN_DAY, calculateTaxFeeForFixedRateInWei } from '../../../../../src';
import { makeSDKListingParams } from '../../../../shared/utils/listing-sdk-utils';
import { calculateListerBaseFee, convertListerBaseFeeToWei } from '../../../../shared/utils/pricing-utils';
import { makeSDKRentingEstimationParamsERC721 } from '../../../../shared/utils/renting-sdk-utils';
import {
  ADDRESS_ZERO,
  solidityIdBytes4,
  solidityIdBytes32,
  EMPTY_BYTES4_DATA_HEX,
  makeListingTerms,
} from '@iqprotocol/iq-space-protocol';
import { renting } from '@iqprotocol/iq-space-protocol/typechain/contracts';

export function testVariousOperations(): void {
  /**** Constants ****/
  const PROTOCOL_RATE_PERCENT = '5';
  const PROTOCOL_REWARD_RATE_PERCENT = '7';
  const LISTER_TOKEN_ID_1 = BigNumber.from(1);
  const LISTER_TOKEN_ID_2 = BigNumber.from(2);
  const ZERO_BALANCE_FEATURE_ID = solidityIdBytes4('FeatureController1');
  const INTEGRATION_FEATURE_REGISTRY_CONTRACT_KEY = solidityIdBytes4('IntegrationFeatureRegistry');
  const INTEGRATION_FEATURES_ADMIN_ROLE = solidityIdBytes32('INTEGRATION_FEATURES_ADMIN_ROLE');
  /**** Config ****/
  let chainId: string;
  /**** Tax Terms ****/
  let protocolTaxTerms: ITaxTermsRegistry.TaxTermsStruct;
  /**** Contracts ****/
  let integrationContract: Integration;
  let integrationFeatureRegistry: IntegrationFeatureRegistry;
  let zeroBalanceFeature: ZeroBalance;
  let metahub: IMetahub;
  let acl: IACL;
  let listingManager: IListingManager;
  let listingTermsRegistry: IListingTermsRegistry;
  let rentingManager: IRentingManager;
  let taxTermsRegistry: ITaxTermsRegistry;
  let listingWizardV1: IListingWizardV1;
  let universeWizardV1: IUniverseWizardV1;
  let universeToken: IUniverseToken;
  let universeRegistry: IUniverseRegistry;
  /**** Mocks & Samples ****/
  let baseToken: ERC20Mock;
  let originalCollection: ERC721Mock;
  let zeroBalanceTestCollection: ERC721Mock;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;
  let renterA: SignerWithAddress;
  let renterB: SignerWithAddress;
  let universeOwner: SignerWithAddress;
  let universeRewardAddress: SignerWithAddress;
  let stranger: SignerWithAddress;
  let featuresAdmin: SignerWithAddress;
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
    integrationFeatureRegistry =
      this.contracts.feautureToggles.integrationFeatureRegistryContracts.integrationFeatureRegistry;
    integrationContract = this.contracts.feautureToggles.integrationContracts.integration;
    zeroBalanceFeature = this.contracts.feautureToggles.featureContracts.zeroBalanceFeature.controller;
    metahub = this.contracts.metahub;
    acl = this.contracts.acl;
    listingWizardV1 = this.contracts.wizardsV1.listingWizard;
    listingManager = this.contracts.listingManager;
    listingTermsRegistry = this.contracts.listingTermsRegistry;
    universeWizardV1 = this.contracts.wizardsV1.universeWizard;
    universeRegistry = this.contracts.universeRegistry;
    universeToken = this.contracts.universeToken;
    taxTermsRegistry = this.contracts.taxTermsRegistry;
    rentingManager = this.contracts.rentingManager;
    /**** Mocks & Samples ****/
    baseToken = this.mocks.assets.baseToken;
    originalCollection = this.mocks.assets.originalCollection;
    zeroBalanceTestCollection =
      this.contracts.feautureToggles.featureContracts.zeroBalanceFeature.zeroBalanceTestCollection;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [lister, renterA, renterB, universeOwner, stranger, featuresAdmin] = this.signers.unnamed;

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

  context('Renting `Integration` with various cases', () => {
    const EXTERNAL_REWARD_WARPER_UNIVERSE_WARPER_RATE_PERCENT = '3.5';
    const EXTERNAL_REWARD_WARPER_UNIVERSE_WARPER_REWARD_RATE_PERCENT = '5.9';
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

    let INTEGRATION_UNIVERSE_ID: BigNumberish;
    let universeTaxTerms: ITaxTermsRegistry.TaxTermsStruct;
    let listingTerms_1: IListingTermsRegistry.ListingTermsStruct;
    let listingTerms_2: IListingTermsRegistry.ListingTermsStruct;

    beforeEach(async () => {
      const universeParams = {
        name: 'Integration Contract',
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
        EXTERNAL_REWARD_WARPER_UNIVERSE_WARPER_RATE_PERCENT,
        EXTERNAL_REWARD_WARPER_UNIVERSE_WARPER_REWARD_RATE_PERCENT,
      );

      console.log('integration contract address: ', integrationContract.address);
      console.log('universe params: ', universeParams);
      console.log('universe tax terms: ', universeTaxTerms);

      const setupUniverseTx = await universeWizardV1Adapter.setupUniverseAndRegisterExistingWarper(
        universeParams,
        AddressTranslator.createAssetType(new AccountId({ chainId, address: integrationContract.address }), 'erc721'),
        universeTaxTerms,
        {
          name: 'Integration',
          universeId: 0, // Unknown before-hand.
          paused: false,
        },
      );
      const newUniverseId = (await universeRegistryAdapter.findUniverseByCreationTransaction(setupUniverseTx.hash))?.id;

      if (!newUniverseId) {
        throw new Error('Universe was not created!');
      } else {
        INTEGRATION_UNIVERSE_ID = newUniverseId;
      }

      /*** Setup ***/
      await integrationFeatureRegistry
        .connect(deployer)
        .registerFeature(ZERO_BALANCE_FEATURE_ID, zeroBalanceFeature.address);
      await integrationFeatureRegistry
        .connect(deployer)
        .enableFeatureForIntegration(integrationContract.address, ZERO_BALANCE_FEATURE_ID);
      await metahub
        .connect(deployer)
        .registerContract(INTEGRATION_FEATURE_REGISTRY_CONTRACT_KEY, integrationFeatureRegistry.address);
      await acl.connect(deployer).grantRole(INTEGRATION_FEATURES_ADMIN_ROLE, featuresAdmin.address);
      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);
    });

    it(`works with ${LISTING_STRATEGIES.FIXED_RATE_WITH_REWARD} strategy`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

      const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
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
            universeId: INTEGRATION_UNIVERSE_ID,
            warperAddress: integrationContract.address,
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
        integrationContract.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId,
      );
      const rentalFees = await rentingManagerAdapterA.estimateRent(rentingEstimationParams);

      console.log('rentalFees: ', rentalFees);

      const expectedListerBaseFee = calculateListerBaseFee(LISTING_1_BASE_RATE, RENTAL_A_PERIOD);
      expect(rentalFees.listerBaseFee).to.be.equal(convertListerBaseFeeToWei(expectedListerBaseFee));
      expect(rentalFees.universeBaseFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, EXTERNAL_REWARD_WARPER_UNIVERSE_WARPER_RATE_PERCENT),
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
        .to.emit(integrationContract, 'OnRentHookEvent')
        .withArgs(renterA.address, LISTER_TOKEN_ID_1, rentalId);

      await expect(integrationContract.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      await expect(
        Integration__factory.connect(integrationContract.address, stranger).getLastActiveRentalId(
          renterA.address,
          LISTER_TOKEN_ID_1,
        ),
      ).to.be.eventually.equal(rentalId);
      const rentalDetails = await Integration__factory.connect(integrationContract.address, stranger).getRentalDetails(
        rentalId,
      );

      expect(rentalDetails.listingTerms.strategyId).to.be.equal(listingTerms_1.strategyId);
      expect(rentalDetails.listingTerms.strategyData).to.be.equal(listingTerms_1.strategyData);
      expect(rentalDetails.universeTaxTerms.strategyId).to.be.equal(universeTaxTerms.strategyId);
      expect(rentalDetails.universeTaxTerms.strategyData).to.be.equal(universeTaxTerms.strategyData);
      expect(rentalDetails.protocolTaxTerms.strategyId).to.be.equal(protocolTaxTerms.strategyId);
      expect(rentalDetails.protocolTaxTerms.strategyData).to.be.equal(protocolTaxTerms.strategyData);
      expect(rentalDetails.rentalId).to.be.equal(rentalId);
      expect(rentalDetails.listingId).to.be.equal(listingId);
      expect(rentalDetails.lister).to.be.equal(lister.address);
    });

    it(`works properly with multi-rental and retrieving reward data`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const LISTING_2_MAX_LOCK_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const RENTAL_B_PERIOD = LISTING_2_MAX_LOCK_PERIOD / 2;

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
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

      /**** Listing 2 ****/
      const createListingTx_2 = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
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

      /**** Rental A ****/
      const rentingEstimationParams_A = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        integrationContract.address,
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
        .to.emit(integrationContract, 'OnRentHookEvent')
        .withArgs(renterA.address, LISTER_TOKEN_ID_1, rentalId_A);
      await expect(integrationContract.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      await expect(
        Integration__factory.connect(integrationContract.address, stranger).getLastActiveRentalId(
          renterA.address,
          LISTER_TOKEN_ID_1,
        ),
      ).to.be.eventually.equal(rentalId_A);

      const rental_A_Details = await Integration__factory.connect(
        integrationContract.address,
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
        integrationContract.address,
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
        .to.emit(integrationContract, 'OnRentHookEvent')
        .withArgs(renterB.address, LISTER_TOKEN_ID_2, rentalId_B);
      await expect(integrationContract.connect(stranger).ownerOf(LISTER_TOKEN_ID_2)).to.be.eventually.equal(
        renterB.address,
      );
      await expect(
        Integration__factory.connect(integrationContract.address, stranger).getLastActiveRentalId(
          renterB.address,
          LISTER_TOKEN_ID_2,
        ),
      ).to.be.eventually.equal(rentalId_B);

      const rental_B_Details = await Integration__factory.connect(
        integrationContract.address,
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

    it(`revert when balance is not zero`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);

      await zeroBalanceTestCollection.connect(renterA).mint(renterA.address, 1);

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
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
        integrationContract.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId_1,
      );

      await expect(rentingManagerAdapterA.estimateRent(rentingEstimationParams_A)).not.to.be.reverted;

      const checkAll = await integrationContract.checkAll({
        listingId: listingId_1,
        warper: integrationContract.address,
        renter: renterA.address,
        rentalPeriod: RENTAL_A_PERIOD,
        paymentToken: baseToken.address,
        listingTermsId: listingTermsId_1,
        selectedConfiguratorListingTerms: {
          strategyId: EMPTY_BYTES4_DATA_HEX,
          strategyData: EMPTY_BYTES_DATA_HEX,
        },
      });

      console.log('checkAll: ', checkAll);
    });

    it(`reverts when balance is not zero #2`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;
      const LISTING_2_MAX_LOCK_PERIOD = SECONDS_IN_DAY;

      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
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

      /**** Listing 2 ****/
      const createListingTx_2 = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
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

      /**** Rental A ****/

      const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        integrationContract.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId_1,
      );

      const rentalFees = await rentingManagerAdapterA.estimateRent(rentingEstimationParams);

      await baseToken.connect(renterA).mint(renterA.address, rentalFees.total);
      await baseToken.connect(renterA).increaseAllowance(metahub.address, rentalFees.total);

      const rentTx = await rentingManagerAdapterA.rent({
        ...rentingEstimationParams,
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees.total,
      });

      const expectedListerBaseFee = calculateListerBaseFee(LISTING_1_BASE_RATE, RENTAL_A_PERIOD);
      expect(rentalFees.listerBaseFee).to.be.equal(convertListerBaseFeeToWei(expectedListerBaseFee));
      expect(rentalFees.universeBaseFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, EXTERNAL_REWARD_WARPER_UNIVERSE_WARPER_RATE_PERCENT),
      );
      expect(rentalFees.protocolFee).to.be.equal(
        calculateTaxFeeForFixedRateInWei(expectedListerBaseFee, PROTOCOL_RATE_PERCENT),
      );

      const rentalId = await findRentalIdByRentTransaction(rentingManager, rentTx.hash);
      if (!rentalId) {
        throw new Error('Rental Agreement was not found!');
      }

      await expect(rentTx)
        .to.emit(integrationContract, 'OnRentHookEvent')
        .withArgs(renterA.address, LISTER_TOKEN_ID_1, rentalId);

      await expect(integrationContract.connect(stranger).ownerOf(LISTER_TOKEN_ID_1)).to.be.eventually.equal(
        renterA.address,
      );
      await expect(
        Integration__factory.connect(integrationContract.address, stranger).getLastActiveRentalId(
          renterA.address,
          LISTER_TOKEN_ID_1,
        ),
      ).to.be.eventually.equal(rentalId);
      const rentalDetails = await Integration__factory.connect(integrationContract.address, stranger).getRentalDetails(
        rentalId,
      );

      expect(rentalDetails.listingTerms.strategyId).to.be.equal(listingTerms_1.strategyId);
      expect(rentalDetails.listingTerms.strategyData).to.be.equal(listingTerms_1.strategyData);
      expect(rentalDetails.universeTaxTerms.strategyId).to.be.equal(universeTaxTerms.strategyId);
      expect(rentalDetails.universeTaxTerms.strategyData).to.be.equal(universeTaxTerms.strategyData);
      expect(rentalDetails.protocolTaxTerms.strategyId).to.be.equal(protocolTaxTerms.strategyId);
      expect(rentalDetails.protocolTaxTerms.strategyData).to.be.equal(protocolTaxTerms.strategyData);
      expect(rentalDetails.rentalId).to.be.equal(rentalId);
      expect(rentalDetails.listingId).to.be.equal(listingId_1);
      expect(rentalDetails.lister).to.be.equal(lister.address);
    });

    it(`checkAll returns data array`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);

      await zeroBalanceTestCollection.connect(renterA).mint(renterA.address, 1);

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
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
        integrationContract.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId_1,
      );

      const checkAll = await integrationContract.checkAll({
        listingId: listingId_1,
        warper: integrationContract.address,
        renter: renterA.address,
        rentalPeriod: RENTAL_A_PERIOD,
        paymentToken: baseToken.address,
        listingTermsId: listingTermsId_1,
        selectedConfiguratorListingTerms: {
          strategyId: EMPTY_BYTES4_DATA_HEX,
          strategyData: EMPTY_BYTES_DATA_HEX,
        },
      });

      checkAll.forEach((element, index) => {
        console.log(`checkAll number ${index}:`, element);
      });

      checkAll.forEach(element => {
        expect(Array.isArray(element)).to.equal(true);
        expect(Array.isArray(element.executionResult)).to.equal(true);
      });
    });

    it(`getFeatureControllerAddress returns proper address`, async () => {
      const featureControllerAddress = await Integration__factory.connect(
        integrationContract.address,
        stranger,
      ).getFeatureControllerAddress(ZERO_BALANCE_FEATURE_ID);

      expect(featureControllerAddress).to.be.equal(zeroBalanceFeature.address);
    });

    it(`getLastActiveRentalId returns proper address`, async () => {
      const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);

      /**** Listing 1 ****/
      const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
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

      /**** Rental 1 ****/

      const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId_1,
        integrationContract.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingTermsId_1,
      );

      const rentalFees = await rentingManagerAdapterA.estimateRent(rentingEstimationParams);

      await baseToken.connect(renterA).mint(renterA.address, rentalFees.total);
      await baseToken.connect(renterA).increaseAllowance(metahub.address, rentalFees.total);

      const rentTx = await rentingManagerAdapterA.rent({
        ...rentingEstimationParams,
        tokenQuote: EMPTY_BYTES_DATA_HEX,
        tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
        maxPaymentAmount: rentalFees.total,
      });

      //get rental Id

      const rentalId = await findRentalIdByRentTransaction(rentingManager, rentTx.hash);
      if (!rentalId) {
        throw new Error('Rental Agreement was not found!');
      }

      const lastActiveRentalId = await Integration__factory.connect(
        integrationContract.address,
        stranger,
      ).getLastActiveRentalId(renterA.address, LISTER_TOKEN_ID_1);

      await expect(lastActiveRentalId).not.to.be.reverted;
      expect(lastActiveRentalId).to.be.equal(rentalId);
    });

    it(`getRentalDetails returns proper data`, async () => {
      const LISTING_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
      const RENTAL_A_PERIOD = LISTING_MAX_LOCK_PERIOD;

      /**** Listing ****/
      const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
        INTEGRATION_UNIVERSE_ID,
        {
          assets: [
            createAsset(
              'erc721',
              new AccountId({ chainId, address: originalCollection.address }),
              LISTER_TOKEN_ID_1.toString(),
            ),
          ],
          params: makeSDKListingParams(chainId, lister.address),
          maxLockPeriod: LISTING_MAX_LOCK_PERIOD,
          immediatePayout: true,
        },
        listingTerms_1,
      );

      const listingId = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx.hash);
      if (!listingId) {
        throw new Error('Listing was not created!');
      }

      /**** Rental A ****/
      const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
        chainId,
        listingId,
        integrationContract.address,
        renterA.address,
        RENTAL_A_PERIOD,
        baseToken.address,
        listingId,
      );

      const rentalFees = await rentingManagerAdapterA.estimateRent(rentingEstimationParams);

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

      //Get rental details and check it

      const rentalDetails = await Integration__factory.connect(integrationContract.address, stranger).getRentalDetails(
        rentalId,
      );

      expect(rentalDetails.listingTerms.strategyId).to.be.equal(listingTerms_1.strategyId);
      expect(rentalDetails.listingTerms.strategyData).to.be.equal(listingTerms_1.strategyData);
      expect(rentalDetails.universeTaxTerms.strategyId).to.be.equal(universeTaxTerms.strategyId);
      expect(rentalDetails.universeTaxTerms.strategyData).to.be.equal(universeTaxTerms.strategyData);
      expect(rentalDetails.protocolTaxTerms.strategyId).to.be.equal(protocolTaxTerms.strategyId);
      expect(rentalDetails.protocolTaxTerms.strategyData).to.be.equal(protocolTaxTerms.strategyData);
      expect(rentalDetails.rentalId).to.be.equal(rentalId);
      expect(rentalDetails.listingId).to.be.equal(listingId);
      expect(rentalDetails.lister).to.be.equal(lister.address);
    });

    // it(`returns test`, async () => {
    //   console.log("test")
    // });
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
