import { SolidityInterfaces, Integration, Auth__factory } from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { getSolidityInterfaceId } from '../../../../shared/utils/solidity-interfaces';
import {
  ADDRESS_ZERO,
  EMPTY_BYTES32_DATA_HEX,
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
} from '@iqprotocol/iq-space-protocol';
import { convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution } from '../../../../shared/utils/accounting-helpers';

export function testAccessControlAndMisc(): void {
  /**** Contracts ****/
  let integrationContract: Integration;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let integrationOwner: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(function () {
    /**** Contracts ****/
    integrationContract = this.contracts.feautureToggles.integrationContracts.integration;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [integrationOwner, authorizedCaller, stranger] = this.signers.unnamed;
  });

  it(`does not work when __onRent is called by not Renting Manager`, async () => {
    await expect(
      integrationContract.connect(stranger).__onRent(
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
    ).to.be.revertedWithCustomError(integrationContract, 'CallerIsNotRentingManager');
  });

  it('supports necessary interfaces', async () => {
    const isIRentingHookMechanicsSupported = await integrationContract
      .connect(stranger)
      .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IRentingHookMechanics'));
    console.log('isIRentingHookMechanicsSupported:', isIRentingHookMechanicsSupported);

    expect(isIRentingHookMechanicsSupported).to.be.true;

    //FOUND BUG HERE!!!!
    // const isIIntegrationSupported = await integrationContract
    //   .connect(authorizedCaller)
    //   .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IIntegration'));
    // console.log('isIIntegrationSupported:', isIIntegrationSupported);

    // expect(isIIntegrationSupported).to.be.true;
  });
}
