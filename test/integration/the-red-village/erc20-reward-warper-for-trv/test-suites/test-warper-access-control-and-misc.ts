import { Auth__factory, ERC20RewardWarperForTRV, SolidityInterfaces } from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  ADDRESS_ZERO,
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES32_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
} from '@iqprotocol/iq-space-sdk-js';
import { expect } from 'chai';
import { convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution } from '../../../../shared/utils/accounting-helpers';
import { getSolidityInterfaceId } from '../../../../shared/utils/solidity-interfaces';

export function testWarperAccessControlAndMisc(): void {
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
    /**** Contracts ****/
    erc20RewardWarperForTRV = this.contracts.theRedVillage.erc20RewardWarperForTRV;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [warperOwner, authorizedCaller, stranger] = this.signers.unnamed;

    await erc20RewardWarperForTRV.connect(deployer).transferOwnership(warperOwner.address);
    await Auth__factory.connect(erc20RewardWarperForTRV.address, warperOwner).setAuthorizationStatus(
      authorizedCaller.address,
      true,
    );
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
        convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution(
          '0',
          '0',
          '0',
          '0',
          ADDRESS_ZERO,
          ADDRESS_ZERO,
          ADDRESS_ZERO,
          0,
        ),
      ),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, 'CallerIsNotRentingManager');
  });

  it(`does not work when onJoinTournament is called by non-authorized caller`, async () => {
    await expect(
      erc20RewardWarperForTRV.connect(stranger).onJoinTournament(0, 0, ADDRESS_ZERO, 0),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, 'CallerIsNotAuthorized');

    // Even, if it is a Warper owner (which is not authorized by default)
    await expect(
      erc20RewardWarperForTRV.connect(warperOwner).onJoinTournament(0, 0, ADDRESS_ZERO, 0),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, 'CallerIsNotAuthorized');
  });

  it(`does not work when disperseRewards is called by non-authorized caller`, async () => {
    await expect(
      erc20RewardWarperForTRV.connect(stranger).disperseRewards(0, 0, 0, 0, ADDRESS_ZERO, ADDRESS_ZERO),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, 'CallerIsNotAuthorized');

    // Even, if it is a Warper owner (which is not authorized by default)
    await expect(
      erc20RewardWarperForTRV.connect(warperOwner).disperseRewards(0, 0, 0, 0, ADDRESS_ZERO, ADDRESS_ZERO),
    ).to.be.revertedWithCustomError(erc20RewardWarperForTRV, 'CallerIsNotAuthorized');
  });

  it('supports necessary interfaces', async () => {
    await expect(
      erc20RewardWarperForTRV
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC721')),
    ).to.be.fulfilled;
    await expect(
      erc20RewardWarperForTRV
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC165')),
    ).to.be.fulfilled;

    await expect(
      erc20RewardWarperForTRV
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC20RewardWarperForTRV')),
    ).to.be.fulfilled;

    await expect(
      erc20RewardWarperForTRV
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IWarper')),
    ).to.be.fulfilled;
    await expect(
      erc20RewardWarperForTRV
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC721Warper')),
    ).to.be.fulfilled;

    await expect(
      erc20RewardWarperForTRV
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IRentingHookMechanics')),
    ).to.be.fulfilled;
    await expect(
      erc20RewardWarperForTRV
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IAvailabilityPeriodMechanics')),
    ).to.be.fulfilled;
    await expect(
      erc20RewardWarperForTRV
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IRentalPeriodMechanics')),
    ).to.be.fulfilled;
  });
}
