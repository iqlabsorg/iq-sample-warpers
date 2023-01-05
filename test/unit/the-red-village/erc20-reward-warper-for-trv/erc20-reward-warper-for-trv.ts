import {
  IListingManager,
  IListingTermsRegistry, IListingWizardV1,
  IMetahub, IRentingManager, ITaxTermsRegistry, IUniverseRegistry, IUniverseWizardV1, IWarperWizardV1
} from '@iqprotocol/solidity-contracts-nft/typechain';
import { ERC20RewardWarperForTRV } from '../../../../typechain';
import { shouldBehaveLikeERC20RewardWarper } from './erc20-reward-warper-for-trv.behaviour';
import { unitFixtureERC20RewardWarper } from './erc20-reward-warper-for-trv.fixture';
import { ChainId } from "@iqprotocol/iq-space-sdk-js";
import { getChainId } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

export function unitTestERC20RewardWarperForTRV(): void {
  describe('ERC20RewardWarperForTRV', function () {
    beforeEach(async function () {
      const {
        contractsInfra,
        baseToken,
        originalCollection,
        erc20RewardWarperForTRV,
        rewardToken
      } = await loadFixture(
        unitFixtureERC20RewardWarper,
      );

      const metahub = contractsInfra.metahub as IMetahub;
      const listingManager = contractsInfra.listingManager as IListingManager;
      const listingTermsRegistry = contractsInfra.listingTermsRegistry as IListingTermsRegistry;
      const rentingManager = contractsInfra.rentingManager as IRentingManager;
      const universeRegistry = contractsInfra.universeRegistry as IUniverseRegistry;
      const taxTermsRegistry = contractsInfra.taxTermsRegistry as ITaxTermsRegistry;

      const listingWizardV1 = contractsInfra.listingWizardV1 as IListingWizardV1;
      const universeWizardV1 = contractsInfra.universeWizardV1 as IUniverseWizardV1;
      const warperWizardV1 = contractsInfra.warperWizardV1 as IWarperWizardV1;

      this.testChainId = new ChainId({
        namespace: 'eip155',
        reference: await getChainId(),
      });

      this.contracts.metahub = metahub;

      this.contracts.listingManager = listingManager;
      this.contracts.listingTermsRegistry = listingTermsRegistry;
      this.contracts.rentingManager = rentingManager;
      this.contracts.universeRegistry = universeRegistry;
      this.contracts.taxTermsRegistry = taxTermsRegistry;

      this.contracts.wizardsV1 = {
        listingWizard: listingWizardV1,
        universeWizard: universeWizardV1,
        warperWizard: warperWizardV1,
      };

      this.mocks.assets.originalCollection = originalCollection;
      this.mocks.assets.baseToken = baseToken;

      this.contracts.theRedVillage = {
        erc20RewardWarperForTRV,
        rewardToken,
      };
    });

    shouldBehaveLikeERC20RewardWarper();
  });
}
