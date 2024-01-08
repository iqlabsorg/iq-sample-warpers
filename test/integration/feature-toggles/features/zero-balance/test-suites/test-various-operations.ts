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
  SolidityInterfaces,
} from '@iqprotocol/iq-space-protocol/typechain';
import { convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution } from '../../../../../shared/utils/accounting-helpers';
import {
  Auth__factory,
  Integration,
  IntegrationFeatureRegistry,
  ZeroBalance,
  Integration__factory,
} from '../../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, BigNumberish } from 'ethers';
import {
  AccountId,
  AddressTranslator,
  ChainId,
  EMPTY_BYTES_DATA_HEX,
  EMPTY_BYTES32_DATA_HEX,
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
import { SECONDS_IN_DAY, calculateTaxFeeForFixedRateInWei } from '../../../../../../src';
import { makeSDKListingParams } from '../../../../../shared/utils/listing-sdk-utils';
import { calculateListerBaseFee, convertListerBaseFeeToWei } from '../../../../../shared/utils/pricing-utils';
import { makeSDKRentingEstimationParamsERC721 } from '../../../../../shared/utils/renting-sdk-utils';
import {
  ADDRESS_ZERO,
  solidityIdBytes4,
  solidityIdBytes32,
  EMPTY_BYTES4_DATA_HEX,
  makeListingTerms,
} from '@iqprotocol/iq-space-protocol';
import { renting } from '@iqprotocol/iq-space-protocol/typechain/contracts';
import { getSolidityInterfaceId } from '../../../../../shared/utils/solidity-interfaces';

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
  let solidityInterfaces: SolidityInterfaces;
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
  let zeroBalanceTestCollection2: ERC721Mock;
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
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    taxTermsRegistry = this.contracts.taxTermsRegistry;
    rentingManager = this.contracts.rentingManager;
    /**** Mocks & Samples ****/
    baseToken = this.mocks.assets.baseToken;
    originalCollection = this.mocks.assets.originalCollection;
    zeroBalanceTestCollection =
      this.contracts.feautureToggles.featureContracts.zeroBalanceFeature.zeroBalanceTestCollection;
    zeroBalanceTestCollection2 =
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

  context('Zero Balance feature operations', () => {
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
    });

    it(`setZeroBalanceAddresses should set address correctly`, async () => {
      await expect(
        zeroBalanceFeature
          .connect(universeOwner)
          .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection2.address]),
      ).to.be.not.reverted;
    });

    it(`setZeroBalanceAddresses should set addresses correctly`, async () => {
      await expect(
        zeroBalanceFeature
          .connect(universeOwner)
          .setZeroBalanceAddresses(integrationContract.address, [
            zeroBalanceTestCollection.address,
            zeroBalanceTestCollection2.address,
          ]),
      ).to.be.not.reverted;
    });

    it(`setZeroBalanceAddresses should be reverted when address is not integration owner`, async () => {
      await expect(
        zeroBalanceFeature
          .connect(stranger)
          .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]),
      ).to.be.reverted;
    });

    it(`setZeroBalanceAddresses should emit ZeroBalanceAddressesSet event`, async () => {
      await expect(
        zeroBalanceFeature
          .connect(universeOwner)
          .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]),
      )
        .to.emit(zeroBalanceFeature, 'ZeroBalanceAddressesSet')
        .withArgs([zeroBalanceTestCollection.address]);
    });

    it(`ZeroBalanceAddressesSet event should work correctly with multiple addresses set`, async () => {
      await expect(
        zeroBalanceFeature
          .connect(universeOwner)
          .setZeroBalanceAddresses(integrationContract.address, [
            zeroBalanceTestCollection.address,
            zeroBalanceTestCollection2.address,
          ]),
      )
        .to.emit(zeroBalanceFeature, 'ZeroBalanceAddressesSet')
        .withArgs([zeroBalanceTestCollection.address, zeroBalanceTestCollection2.address]);
    });

    it(`setZeroBalanceAddresses should revrite seted addresses correctly`, async () => {
      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);

      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection2.address]);

      await expect(
        zeroBalanceFeature.connect(universeOwner).getZeroBalanceAddresses(integrationContract.address),
      ).to.eventually.deep.equal([zeroBalanceTestCollection2.address]);
    });

    it(`setZeroBalanceAddresses should be reverted if seted value is not address`, async () => {
      await expect(
        zeroBalanceFeature
          .connect(universeOwner)
          .setZeroBalanceAddresses(integrationContract.address, [EMPTY_BYTES32_DATA_HEX]),
      ).to.be.rejected;

      await expect(
        zeroBalanceFeature.connect(universeOwner).setZeroBalanceAddresses(integrationContract.address, ['ANY_STRING']),
      ).to.be.rejected;
    });

    it(`getZeroBalanceAddresses should return seted address`, async () => {
      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);

      await expect(
        zeroBalanceFeature.connect(universeOwner).getZeroBalanceAddresses(integrationContract.address),
      ).to.eventually.deep.equal([zeroBalanceTestCollection.address]);
    });

    it(`getZeroBalanceAddresses should return seted addresses`, async () => {
      await zeroBalanceFeature
        .connect(universeOwner)
        .setZeroBalanceAddresses(integrationContract.address, [
          zeroBalanceTestCollection.address,
          zeroBalanceTestCollection2.address,
        ]);

      await expect(
        zeroBalanceFeature.connect(universeOwner).getZeroBalanceAddresses(integrationContract.address),
      ).to.eventually.deep.equal([zeroBalanceTestCollection.address, zeroBalanceTestCollection2.address]);
    });

    it(`execute works correctly when renter has zero balance for all specified collections`, async () => {
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

      await expect(rentingManagerAdapterA.estimateRent(rentingEstimationParams)).not.to.be.reverted;

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

      const executeFeatureResult = await integrationContract.callStatic.executeFeature(ZERO_BALANCE_FEATURE_ID, {
        rentalId,
        rentalAgreement: {
          warpedAssets: [],
          universeId: 0,
          collectionId: EMPTY_BYTES32_DATA_HEX,
          listingId: 0,
          renter: renterA.address,
          startTime: 0,
          endTime: 0,
          agreementTerms: {
            listingTerms: {
              strategyId: EMPTY_BYTES4_DATA_HEX,
              strategyData: EMPTY_BYTES_DATA_HEX,
            },
            universeTaxTerms: {
              strategyId: EMPTY_BYTES4_DATA_HEX,
              strategyData: EMPTY_BYTES_DATA_HEX,
            },
            protocolTaxTerms: {
              strategyId: EMPTY_BYTES4_DATA_HEX,
              strategyData: EMPTY_BYTES_DATA_HEX,
            },
            paymentTokenData: {
              paymentToken: ADDRESS_ZERO,
              paymentTokenQuote: 0,
            },
          },
        },
        rentalEarnings: convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution(
          '0',
          '0',
          '0',
          '0',
          ADDRESS_ZERO,
          ADDRESS_ZERO,
          ADDRESS_ZERO,
          0,
        ),
      });

      await expect(
        integrationContract.executeFeature(ZERO_BALANCE_FEATURE_ID, {
          rentalId,
          rentalAgreement: {
            warpedAssets: [],
            universeId: 0,
            collectionId: EMPTY_BYTES32_DATA_HEX,
            listingId: 0,
            renter: renterA.address,
            startTime: 0,
            endTime: 0,
            agreementTerms: {
              listingTerms: {
                strategyId: EMPTY_BYTES4_DATA_HEX,
                strategyData: EMPTY_BYTES_DATA_HEX,
              },
              universeTaxTerms: {
                strategyId: EMPTY_BYTES4_DATA_HEX,
                strategyData: EMPTY_BYTES_DATA_HEX,
              },
              protocolTaxTerms: {
                strategyId: EMPTY_BYTES4_DATA_HEX,
                strategyData: EMPTY_BYTES_DATA_HEX,
              },
              paymentTokenData: {
                paymentToken: ADDRESS_ZERO,
                paymentTokenQuote: 0,
              },
            },
          },
          rentalEarnings: convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution(
            '0',
            '0',
            '0',
            '0',
            ADDRESS_ZERO,
            ADDRESS_ZERO,
            ADDRESS_ZERO,
            0,
          ),
        }),
      ).to.be.not.reverted;

      console.log('executeFeatureResult', executeFeatureResult);

      expect(executeFeatureResult[0]).to.be.true;
      expect(executeFeatureResult[1]).to.equal('Renter has zero balance for all specified collections');
    });

    // it(`execute works correctly when renter has balance for specified collection`, async () => {
    //   const LISTING_1_MAX_LOCK_PERIOD = SECONDS_IN_DAY;
    //   const RENTAL_A_PERIOD = LISTING_1_MAX_LOCK_PERIOD;

    //   await zeroBalanceFeature
    //     .connect(universeOwner)
    //     .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection2.address]);

    //   await zeroBalanceTestCollection2.connect(deployer).mint(renterA.address, 1);

    //   await zeroBalanceFeature
    //     .connect(universeOwner)
    //     .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);

    //   await zeroBalanceTestCollection.connect(renterA).mint(renterA.address, 2);
    //   /**** Listing 1 ****/
    //   const createListingTx_1 = await listingWizardV1Adapter.createListingWithTerms(
    //     INTEGRATION_UNIVERSE_ID,
    //     {
    //       assets: [
    //         createAsset(
    //           'erc721',
    //           new AccountId({ chainId, address: originalCollection.address }),
    //           LISTER_TOKEN_ID_1.toString(),
    //         ),
    //       ],
    //       params: makeSDKListingParams(chainId, lister.address),
    //       maxLockPeriod: LISTING_1_MAX_LOCK_PERIOD,
    //       immediatePayout: true,
    //     },
    //     listingTerms_1,
    //   );
    //   const listingId_1 = await listingManagerAdapter.findListingIdByCreationTransaction(createListingTx_1.hash);
    //   if (!listingId_1) {
    //     throw new Error('Listing was not created!');
    //   }
    //   const listingTermsId_1 = await listingTermsRegistryAdapter.findListingTermsIdByCreationTransaction(
    //     createListingTx_1.hash,
    //   );
    //   if (!listingTermsId_1) {
    //     throw new Error('Listing Terms were not found!');
    //   }

    //   /**** Rental A ****/

    //   const rentingEstimationParams = makeSDKRentingEstimationParamsERC721(
    //     chainId,
    //     listingId_1,
    //     integrationContract.address,
    //     renterA.address,
    //     RENTAL_A_PERIOD,
    //     baseToken.address,
    //     listingTermsId_1,
    //   );

    //   await expect(rentingManagerAdapterA.estimateRent(rentingEstimationParams)).not.to.be.reverted;
    //   const rentalFees = await rentingManagerAdapterA.estimateRent(rentingEstimationParams);

    //   await baseToken.connect(renterA).mint(renterA.address, rentalFees.total);
    //   await baseToken.connect(renterA).increaseAllowance(metahub.address, rentalFees.total);
    //   console.log('everything fails here');
    //   const rentTx = await rentingManagerAdapterA.rent({
    //     ...rentingEstimationParams,
    //     tokenQuote: EMPTY_BYTES_DATA_HEX,
    //     tokenQuoteSignature: EMPTY_BYTES_DATA_HEX,
    //     maxPaymentAmount: rentalFees.total,
    //   });

    //   const rentalId = await findRentalIdByRentTransaction(rentingManager, rentTx.hash);
    //   if (!rentalId) {
    //     throw new Error('Rental Agreement was not found!');
    //   }

    //   await expect(
    //     integrationContract.executeFeature(ZERO_BALANCE_FEATURE_ID, {
    //       rentalId,
    //       rentalAgreement: {
    //         warpedAssets: [],
    //         universeId: 0,
    //         collectionId: EMPTY_BYTES32_DATA_HEX,
    //         listingId: 0,
    //         renter: renterA.address,
    //         startTime: 0,
    //         endTime: 0,
    //         agreementTerms: {
    //           listingTerms: {
    //             strategyId: EMPTY_BYTES4_DATA_HEX,
    //             strategyData: EMPTY_BYTES_DATA_HEX,
    //           },
    //           universeTaxTerms: {
    //             strategyId: EMPTY_BYTES4_DATA_HEX,
    //             strategyData: EMPTY_BYTES_DATA_HEX,
    //           },
    //           protocolTaxTerms: {
    //             strategyId: EMPTY_BYTES4_DATA_HEX,
    //             strategyData: EMPTY_BYTES_DATA_HEX,
    //           },
    //           paymentTokenData: {
    //             paymentToken: ADDRESS_ZERO,
    //             paymentTokenQuote: 0,
    //           },
    //         },
    //       },
    //       rentalEarnings: convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution(
    //         '0',
    //         '0',
    //         '0',
    //         '0',
    //         ADDRESS_ZERO,
    //         ADDRESS_ZERO,
    //         ADDRESS_ZERO,
    //         0,
    //       ),
    //     }),
    //   ).to.be.reverted;
    // });

    it(`execute reverts if caller is not integration`, async () => {
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

      await expect(rentingManagerAdapterA.estimateRent(rentingEstimationParams)).not.to.be.reverted;

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

      const executeFeatureResult = await integrationContract.callStatic.executeFeature(ZERO_BALANCE_FEATURE_ID, {
        rentalId,
        rentalAgreement: {
          warpedAssets: [],
          universeId: 0,
          collectionId: EMPTY_BYTES32_DATA_HEX,
          listingId: 0,
          renter: renterA.address,
          startTime: 0,
          endTime: 0,
          agreementTerms: {
            listingTerms: {
              strategyId: EMPTY_BYTES4_DATA_HEX,
              strategyData: EMPTY_BYTES_DATA_HEX,
            },
            universeTaxTerms: {
              strategyId: EMPTY_BYTES4_DATA_HEX,
              strategyData: EMPTY_BYTES_DATA_HEX,
            },
            protocolTaxTerms: {
              strategyId: EMPTY_BYTES4_DATA_HEX,
              strategyData: EMPTY_BYTES_DATA_HEX,
            },
            paymentTokenData: {
              paymentToken: ADDRESS_ZERO,
              paymentTokenQuote: 0,
            },
          },
        },
        rentalEarnings: convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution(
          '0',
          '0',
          '0',
          '0',
          ADDRESS_ZERO,
          ADDRESS_ZERO,
          ADDRESS_ZERO,
          0,
        ),
      });

      console.log(executeFeatureResult);

      await expect(
        zeroBalanceFeature.connect(stranger).execute(integrationContract.address, {
          rentalId,
          rentalAgreement: {
            warpedAssets: [],
            universeId: 0,
            collectionId: EMPTY_BYTES32_DATA_HEX,
            listingId: 0,
            renter: renterA.address,
            startTime: 0,
            endTime: 0,
            agreementTerms: {
              listingTerms: {
                strategyId: EMPTY_BYTES4_DATA_HEX,
                strategyData: EMPTY_BYTES_DATA_HEX,
              },
              universeTaxTerms: {
                strategyId: EMPTY_BYTES4_DATA_HEX,
                strategyData: EMPTY_BYTES_DATA_HEX,
              },
              protocolTaxTerms: {
                strategyId: EMPTY_BYTES4_DATA_HEX,
                strategyData: EMPTY_BYTES_DATA_HEX,
              },
              paymentTokenData: {
                paymentToken: ADDRESS_ZERO,
                paymentTokenQuote: 0,
              },
            },
          },
          rentalEarnings: convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution(
            '0',
            '0',
            '0',
            '0',
            ADDRESS_ZERO,
            ADDRESS_ZERO,
            ADDRESS_ZERO,
            0,
          ),
        }),
      ).to.be.reverted;
    });

    it(`check returns proper data`, async () => {
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

      const checkResult = await zeroBalanceFeature.check(renterA.address, {
        rentingParams: {
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
        },
        tokenId: 1,
        amount: 1,
      });

      expect(checkResult.isRentable).to.be.true;
      expect(checkResult.errorMessage).to.equal('Check successful');
    });

    it('supports necessary interfaces', async () => {
      const isIZeroBalanceSupported = await zeroBalanceFeature
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IZeroBalance'));
      console.log('isIZeroBalanceSupported:', isIZeroBalanceSupported);

      expect(isIZeroBalanceSupported).to.be.true;
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
