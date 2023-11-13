import { ADDRESS_ZERO, solidityIdBytes32, solidityIdBytes4 } from '@iqprotocol/iq-space-protocol';
import { IntegrationFeatureRegistry } from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { IACL, IMetahub } from '@iqprotocol/iq-space-protocol/typechain';
import { solidityKeccak256 } from 'ethers/lib/utils';

export function testVariousOperations(): void {
  /**** Constants ****/
  const FEATURE_ID_1 = solidityIdBytes4('FeatureController1');
  const FEATURE_ID_2 = solidityIdBytes4('FeatureController2');
  const INTEGRATION_FEATURE_REGISTRY_CONTRACT_KEY = solidityIdBytes4('IntegrationFeatureRegistry');
  const INTEGRATION_FEATURES_ADMIN_ROLE = solidityIdBytes32('INTEGRATION_FEATURES_ADMIN_ROLE');

  /*** Contracts ***/
  let metahub: IMetahub;
  let acl: IACL;
  let integrationFeatureRegistry: IntegrationFeatureRegistry;

  /*** Mocks & Samples ***/
  // Mocked data or samples to be added as needed

  /*** Signers ***/
  let deployer: SignerWithAddress;
  let featuresAdmin: SignerWithAddress;
  let featureController1: SignerWithAddress;
  let featureController2: SignerWithAddress;
  let integrationContract: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    /*** Contracts ***/
    metahub = this.contracts.metahub;
    acl = this.contracts.acl;
    integrationFeatureRegistry =
      this.contracts.feautureToggles.integrationFeatureRegistryContracts.integrationFeatureRegistry;
    /*** Mocks & Samples ***/
    /*** Signers ***/
    deployer = this.signers.named.deployer;
    [featuresAdmin, featureController1, featureController2, integrationContract, stranger] = this.signers.unnamed;

    /*** Setup ***/
    await metahub
      .connect(deployer)
      .registerContract(INTEGRATION_FEATURE_REGISTRY_CONTRACT_KEY, integrationFeatureRegistry.address);
    await acl.connect(deployer).grantRole(INTEGRATION_FEATURES_ADMIN_ROLE, featuresAdmin.address);
  });

  context('IntegrationFeatureRegistry Contract Operations', () => {
    it('should register itself in contract registry', async () => {
      const contractRegistryAddress = await metahub.getContract(INTEGRATION_FEATURE_REGISTRY_CONTRACT_KEY);
      expect(contractRegistryAddress).to.equal(integrationFeatureRegistry.address);
    });

    it('should register a feature controller correctly', async () => {
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_1, featureController1.address);
      const controller: string = await integrationFeatureRegistry.getFeatureController(FEATURE_ID_1);
      expect(controller).to.equal(featureController1.address);
    });

    it('should not register a feature controller if signer does not have a role', async () => {
      await expect(
        integrationFeatureRegistry.connect(stranger).registerFeature(FEATURE_ID_1, featureController1.address),
      ).to.be.revertedWithCustomError(integrationFeatureRegistry, 'CallerIsNotIntegrationFeaturesAdmin');
    });

    it('should deregister a feature correctly', async () => {
      // First, register a feature
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_1, featureController1.address);

      // Deregister the feature
      await integrationFeatureRegistry.connect(featuresAdmin).deregisterFeature(FEATURE_ID_1);

      // Expect the feature controller to be removed
      const controller = await integrationFeatureRegistry.getFeatureController(FEATURE_ID_1);
      expect(controller).to.equal(ADDRESS_ZERO);
    });

    it('should enable a feature for an integration correctly', async () => {
      // First, register a feature
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_1, featureController1.address);

      // Enable the feature for an integration
      await integrationFeatureRegistry.enableFeatureForIntegration(integrationContract.address, FEATURE_ID_1);

      // Verify the feature is enabled for the integration
      const isEnabled = await integrationFeatureRegistry.isEnabledFeature(integrationContract.address, FEATURE_ID_1);
      expect(isEnabled).to.be.true;
    });

    it('should disable a feature for an integration correctly', async () => {
      // First, register a feature and enable it for an integration
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_1, featureController1.address);
      await integrationFeatureRegistry
        .connect(featuresAdmin)
        .enableFeatureForIntegration(integrationContract.address, FEATURE_ID_1);

      // Disable the feature for the integration
      await integrationFeatureRegistry.disableFeatureForIntegration(integrationContract.address, FEATURE_ID_1);

      // Verify the feature is disabled for the integration
      const isEnabled = await integrationFeatureRegistry.isEnabledFeature(integrationContract.address, FEATURE_ID_1);
      expect(isEnabled).to.be.false;
    });

    it('should list all registered features correctly', async () => {
      // Register two features
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_1, featureController1.address);
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_2, featureController2.address);

      // Fetch all features
      const [featureIds, featureControllers] = await integrationFeatureRegistry.getAllFeatures();

      // Verify both features are listed
      expect(featureIds[0]).to.be.eq(FEATURE_ID_1);
      expect(featureIds[1]).to.be.eq(FEATURE_ID_2);
      expect(featureControllers).to.include(featureController1.address);
    });

    it('should list enabled features for an integration correctly', async () => {
      // Register two features and enable one of them for an integration
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_1, featureController1.address);
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_2, featureController2.address);
      await integrationFeatureRegistry
        .connect(featuresAdmin)
        .enableFeatureForIntegration(integrationContract.address, FEATURE_ID_1);
      await integrationFeatureRegistry
        .connect(featuresAdmin)
        .enableFeatureForIntegration(integrationContract.address, FEATURE_ID_2);

      // Fetch enabled features for the integration
      const [enabledFeatureIds, enabledFeatureControllers] = await integrationFeatureRegistry.getAllIntegrationFeatures(
        integrationContract.address,
      );

      console.log(enabledFeatureIds);
      console.log(enabledFeatureControllers);

      // Verify only the enabled feature is listed
      expect(enabledFeatureIds[0]).to.be.eq(FEATURE_ID_1);
      expect(enabledFeatureIds[1]).to.be.eq(FEATURE_ID_2);
      expect(enabledFeatureControllers[0]).to.be.eq(featureController1.address);
    });

    it('should fetch all enabled feature IDs for a given integration correctly', async () => {
      // Register two features and enable both for an integration
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_1, featureController1.address);
      await integrationFeatureRegistry.connect(featuresAdmin).registerFeature(FEATURE_ID_2, featureController2.address);
      await integrationFeatureRegistry
        .connect(featuresAdmin)
        .enableFeatureForIntegration(integrationContract.address, FEATURE_ID_1);
      await integrationFeatureRegistry
        .connect(featuresAdmin)
        .enableFeatureForIntegration(integrationContract.address, FEATURE_ID_2);

      // Fetch enabled feature IDs for the integration
      const enabledFeatureIds = await integrationFeatureRegistry.getEnabledFeatureIds(integrationContract.address);

      // Verify both feature IDs are listed
      expect(enabledFeatureIds[0]).to.be.eq(FEATURE_ID_1);
      expect(enabledFeatureIds[1]).to.be.eq(FEATURE_ID_2);
    });
  });
}
