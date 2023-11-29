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
  IAssetRentabilityMechanics__factory,
} from '@iqprotocol/iq-space-protocol/typechain';
import { Auth__factory, Integration, IntegrationFeatureRegistry, ZeroBalance } from '../../../../../../typechain';
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
import { SECONDS_IN_DAY, calculateTaxFeeForFixedRateInWei } from '../../../../../../src';
import { makeSDKListingParams } from '../../../../../shared/utils/listing-sdk-utils';
import { calculateListerBaseFee, convertListerBaseFeeToWei } from '../../../../../shared/utils/pricing-utils';
import { makeSDKRentingEstimationParamsERC721 } from '../../../../../shared/utils/renting-sdk-utils';
import {
  ADDRESS_ZERO,
  solidityIdBytes4,
  solidityIdBytes32,
  EMPTY_BYTES4_DATA_HEX,
} from '@iqprotocol/iq-space-protocol';

export function testVariousOperations(): void {
  /**** Constants ****/
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
    await acl.connect(deployer).grantRole(INTEGRATION_FEATURES_ADMIN_ROLE, featuresAdmin.address); //error here?
    await zeroBalanceFeature
      .connect(universeOwner)
      .setZeroBalanceAddresses(integrationContract.address, [zeroBalanceTestCollection.address]);
  });

  context('Zero Balance Feature Operations', () => {
    it('should pass tests', async () => {
      console.log('test');
    });
  });
}
// context('Setting Zero Balance Addresses for an Integration', () => {
//   it('should allow owner to set zero balance addresses', async () => {
//     const initialAddresses = await zeroBalance.getZeroBalanceAddresses(deployer.address);
//     expect(initialAddresses.length).to.equal(0);

//     // Try to set zero balance addresses
//     const addressesToSet = [testZeroBalanceCollection.address];
//     await zeroBalance.setZeroBalanceAddresses(deployer.address, addressesToSet);

//     const updatedAddresses = await zeroBalance.getZeroBalanceAddresses(deployer.address);
//     expect(updatedAddresses[0]).to.equal(addressesToSet[0]);
//   });

//   it('should not allow unauthorized users to set zero balance addresses', async () => {
//     const addressesToSet = [testZeroBalanceCollection.address];
//     await expect(zeroBalance.connect(unauthorizedUser).setZeroBalanceAddresses(deployer.address, addressesToSet)).to.be.revertedWith("One or more addresses are already added"); // Assuming there's a permission check in the contract for this
//   });
// });

// context('Miscellaneous operations for Zero Balance', () => {
//   it('should perform some miscellaneous operation', async () => {
//     //TESTS
//   });
// });
