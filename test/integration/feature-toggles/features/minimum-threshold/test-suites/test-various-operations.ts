import { Integration, IERC721, IntegrationFeatureRegistry, MinimumThreshold } from '../../../../../../typechain';
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
  IUniverseToken,
  SolidityInterfaces,
} from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import {
  AccountId,
  ChainId,
  IQSpace,
  ListingManagerAdapter,
  ListingTermsRegistryAdapter,
  ListingWizardAdapterV1,
  MetahubAdapter,
  RentingManagerAdapter,
  UniverseRegistryAdapter,
  UniverseWizardAdapterV1,
  makeFixedRateWithRewardTaxTermsFromUnconverted,
} from '@iqprotocol/iq-space-sdk-js';
import { solidityIdBytes4, solidityIdBytes32 } from '@iqprotocol/iq-space-protocol';

export function testVariousOperations(): void {
  let minimumThreshold: MinimumThreshold;
  let integrationFeatureRegistry: IntegrationFeatureRegistry;
  let erc721: IERC721;
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
    minimumThreshold = this.contracts.feautureToggles.featureContracts.minimumThresholdFeature.controller;
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

  it('should pass tests', async () => {
    console.log('test');
  });
}
