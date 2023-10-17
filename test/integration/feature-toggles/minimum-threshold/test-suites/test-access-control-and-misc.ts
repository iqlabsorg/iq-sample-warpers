import { Auth__factory, MinimumThreshold, SolidityInterfaces } from '../../../../../typechain';
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
  let minimumThreshold: MinimumThreshold;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let contractOwner: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    /**** Contracts ****/
    minimumThreshold = this.contracts.minimumThreshold.minimumThresholdInstance;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [contractOwner, authorizedCaller, stranger] = this.signers.unnamed;

    await minimumThreshold.connect(deployer).transferOwnership(contractOwner.address);
    await Auth__factory.connect(minimumThreshold.address, contractOwner).setAuthorizationStatus(
      authorizedCaller.address,
      true,
    );
  });

  it(`does not work when __onRent is called by not Renting Manager`, async () => {
    await expect(
      minimumThreshold.connect(stranger).__onRent(
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
    ).to.be.revertedWithCustomError(minimumThreshold, 'CallerIsNotRentingManager');
  });

  // ADD TESTS
}
