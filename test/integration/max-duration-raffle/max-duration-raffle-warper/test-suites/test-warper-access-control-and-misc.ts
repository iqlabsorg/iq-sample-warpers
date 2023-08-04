import { MaxDurationRaffleWarper, SolidityInterfaces } from '../../../../../typechain';
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
  let maxDurationRaffleWarper: MaxDurationRaffleWarper;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(function () {
    /**** Contracts ****/
    maxDurationRaffleWarper = this.contracts.maxDuration.maxDurationRaffleWarper;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [stranger] = this.signers.unnamed;
  });

  it(`does not work when __onRent is called by not Renting Manager`, async () => {
    await expect(
      maxDurationRaffleWarper.connect(stranger).__onRent(
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
    ).to.be.revertedWithCustomError(maxDurationRaffleWarper, 'CallerIsNotRentingManager');
  });

  it('supports necessary interfaces', async () => {
    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC721')),
    ).to.be.fulfilled;
    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC165')),
    ).to.be.fulfilled;

    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IMaxDurationRaffleWarper')),
    ).to.be.fulfilled;

    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IWarper')),
    ).to.be.fulfilled;
    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC721Warper')),
    ).to.be.fulfilled;

    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IRentingHookMechanics')),
    ).to.be.fulfilled;
    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IAvailabilityPeriodMechanics')),
    ).to.be.fulfilled;
    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IRentalPeriodMechanics')),
    ).to.be.fulfilled;
    await expect(
      maxDurationRaffleWarper
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IAssetRentabilityMechanics')),
    ).to.be.fulfilled;
  });
}
