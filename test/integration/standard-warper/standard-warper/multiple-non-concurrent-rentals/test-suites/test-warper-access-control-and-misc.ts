import { Auth__factory, SolidityInterfaces, StandardWarper } from '../../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { getSolidityInterfaceId } from '../../../../../shared/utils/solidity-interfaces';
import {
  ADDRESS_ZERO,
  EMPTY_BYTES32_DATA_HEX,
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
} from '@iqprotocol/iq-space-protocol';
import { convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution } from '../../../../../shared/utils/accounting-helpers';

export function testWarperAccessControlAndMisc(): void {
  /**** Contracts ****/
  let multipleNonConcurrentRentals: StandardWarper;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let warperOwner: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    /**** Contracts ****/
    multipleNonConcurrentRentals = this.contracts.multipleNonCurrentRentals.multipleNonConcurrentRentals;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [warperOwner, authorizedCaller, stranger] = this.signers.unnamed;

    await multipleNonConcurrentRentals.connect(deployer).transferOwnership(warperOwner.address);
    await Auth__factory.connect(multipleNonConcurrentRentals.address, warperOwner).setAuthorizationStatus(
      authorizedCaller.address,
      true,
    );
  });

  it(`does not work when __onRent is called by not Renting Manager`, async () => {
    await expect(
      multipleNonConcurrentRentals.connect(stranger).__onRent(
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
    ).to.be.revertedWithCustomError(multipleNonConcurrentRentals, 'CallerIsNotRentingManager');
  });

  it('supports necessary interfaces', async () => {
    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC721')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC165')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IZeroBalanceWarper')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IExternalRewardWarper')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IAssetRentabilityMechanics')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IWarper')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC721Warper')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IRentingHookMechanics')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IAvailabilityPeriodMechanics')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IRentalPeriodMechanics')),
    ).to.be.fulfilled;

    await expect(
      multipleNonConcurrentRentals
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IStandardWarper')),
    ).to.be.fulfilled;
  });
}
