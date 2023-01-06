import {
  ERC20Mock, ERC721Mock,
  IListingManager,
  IListingTermsRegistry, IListingWizardV1, IMetahub,
  IRentingManager,
  ITaxTermsRegistry, IUniverseRegistry, IUniverseWizardV1
} from "@iqprotocol/solidity-contracts-nft/typechain";
import {
  Auth__factory,
  ERC20RewardWarperForTRV, SolidityInterfaces,
} from "../../../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ChainId,
  UniverseRegistryAdapter,
  UniverseWizardAdapterV1,
} from "@iqprotocol/iq-space-sdk-js";
import { makeTaxTermsFixedRate } from "../../../../shared/utils/tax-terms-utils";
import {
  ADDRESS_ZERO,
  EMPTY_BYTES32_DATA_HEX,
} from "@iqprotocol/solidity-contracts-nft";
import {
  makeListingTermsFixedRate,
} from "../../../../shared/utils/listing-terms-utils";
import { expect } from "chai";
import {
  convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution
} from "../../../../shared/utils/accounting-helpers";
import { getSolidityInterfaceId } from "../../../../shared/utils/solidity-interfaces";

export function testWarperAccessControlAndMisc(): void {
  /**** Config ****/
  let chainId: string;
  /**** Contracts ****/
  let erc20RewardWarperForTRV: ERC20RewardWarperForTRV;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let warperOwner: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    /**** Config ****/
    chainId = (this.testChainId as ChainId).toString();
    /**** Contracts ****/
    erc20RewardWarperForTRV = this.contracts.theRedVillage.erc20RewardWarperForTRV;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [warperOwner, authorizedCaller, stranger] = this.signers.unnamed;

    await erc20RewardWarperForTRV.connect(deployer).transferOwnership(warperOwner.address);
    await Auth__factory.connect(erc20RewardWarperForTRV.address, warperOwner)
      .setAuthorizationStatus(authorizedCaller.address, true);
  });

  it(`does not work when __onRent is called by not Renting Manager`, async () => {
    await expect(
      erc20RewardWarperForTRV.connect(stranger).__onRent(
        0,
        {
          warpedAssets: [],
          universeId: 0,
          collectionId: EMPTY_BYTES32_DATA_HEX,
          listingId: 0,
          renter: ADDRESS_ZERO,
          startTime: 0,
          endTime: 0,
          agreementTerms: {
            listingTerms: makeListingTermsFixedRate("0"),
            universeTaxTerms: makeTaxTermsFixedRate("0"),
            protocolTaxTerms: makeTaxTermsFixedRate("0"),
            paymentTokenData: {
              paymentToken: ADDRESS_ZERO,
              paymentTokenQuote: 0,
            }
          }
        },
        convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution(
          "0",
          "0",
          "0",
          "0",
          ADDRESS_ZERO,
          ADDRESS_ZERO,
          ADDRESS_ZERO,
          0
          )
        ),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, "CallerIsNotRentingManager");
  });

  it(`does not work when onJoinTournament is called by non-authorized caller`, async () => {
    await expect(
      erc20RewardWarperForTRV.connect(stranger).onJoinTournament(
        0, 0, ADDRESS_ZERO, 0
      ),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, "CallerIsNotAuthorized");

    // Even, if it is a Warper owner (which is not authorized by default)
    await expect(
      erc20RewardWarperForTRV.connect(warperOwner).onJoinTournament(
        0, 0, ADDRESS_ZERO, 0
      ),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, "CallerIsNotAuthorized");
  });

  it(`does not work when disperseRewards is called by non-authorized caller`, async () => {
    await expect(
      erc20RewardWarperForTRV.connect(stranger).disperseRewards(
        0,
        0,
        0,
        0,
        ADDRESS_ZERO,
        ADDRESS_ZERO,
      ),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, "CallerIsNotAuthorized");

    // Even, if it is a Warper owner (which is not authorized by default)
    await expect(
      erc20RewardWarperForTRV.connect(warperOwner).disperseRewards(
        0,
        0,
        0,
        0,
        ADDRESS_ZERO,
        ADDRESS_ZERO,
      ),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, "CallerIsNotAuthorized");
  });

  it("supports necessary interfaces", async () => {
    await expect(
      erc20RewardWarperForTRV.connect(stranger).supportsInterface(
        await getSolidityInterfaceId(solidityInterfaces, "IERC721")
      ),
    ).to.be.fulfilled;
    await expect(
      erc20RewardWarperForTRV.connect(stranger).supportsInterface(
        await getSolidityInterfaceId(solidityInterfaces, "IERC165")
      ),
    ).to.be.fulfilled;

    await expect(
      erc20RewardWarperForTRV.connect(stranger).supportsInterface(
        await getSolidityInterfaceId(solidityInterfaces, "IERC20RewardWarperForTRV")
      ),
    ).to.be.fulfilled;

    await expect(
      erc20RewardWarperForTRV.connect(stranger).supportsInterface(
        await getSolidityInterfaceId(solidityInterfaces, "IWarper")
      ),
    ).to.be.fulfilled;
    await expect(
      erc20RewardWarperForTRV.connect(stranger).supportsInterface(
        await getSolidityInterfaceId(solidityInterfaces, "IERC721Warper")
      ),
    ).to.be.fulfilled;

    await expect(
      erc20RewardWarperForTRV.connect(stranger).supportsInterface(
        await getSolidityInterfaceId(solidityInterfaces, "IRentingHookMechanics")
      ),
    ).to.be.fulfilled;
    await expect(
      erc20RewardWarperForTRV.connect(stranger).supportsInterface(
        await getSolidityInterfaceId(solidityInterfaces, "IAvailabilityPeriodMechanics")
      ),
    ).to.be.fulfilled;
    await expect(
      erc20RewardWarperForTRV.connect(stranger).supportsInterface(
        await getSolidityInterfaceId(solidityInterfaces, "IRentalPeriodMechanics")
      ),
    ).to.be.fulfilled;
  });
}
