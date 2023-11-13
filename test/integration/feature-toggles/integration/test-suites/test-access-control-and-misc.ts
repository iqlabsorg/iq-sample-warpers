import { SolidityInterfaces, Integration } from '../../../../../typechain';
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
  let integrationInstance: Integration;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let integrationOwner: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;


  beforeEach(async function () {
    /**** Contracts ****/
    // integrationInstance = this.contracts.integrationInstance;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [integrationOwner, authorizedCaller, stranger] = this.signers.unnamed;
  });

  // it(`does not work when __onRent is called by not Renting Manager`, async () => {
  //   await expect(
  //     integrationInstance.connect(stranger).__onRent(
  //       0,
  //       {
  //         // put right data
  //         universeId: 22,
  //         collectionId: 33,
  //         listingId: 33,
  //         renter: 0xFA24A4B96E7d3DfbBaFB9D4D84267e4Ba7297469,
  //         assetId: 22,
  //         amount: 1,
  //         rentEndTimestamp: 1
  //       },
  //       convertExpectedFeesFromRewardsToEarningsAfterRewardDistribution(
  //         '0',
  //         '0',
  //         '0',
  //         '0',
  //         ADDRESS_ZERO,
  //         ADDRESS_ZERO,
  //         ADDRESS_ZERO,
  //         0,
  //       ),
  //     ),
  //   ).to.be.revertedWithCustomError(integrationInstance, 'CallerIsNotRentingManager');
  // });

  // it('supports necessary interfaces', async () => {
  //   await expect(
  //     integrationInstance
  //       .connect(stranger)
  //       .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IERC721')),
  //   ).to.be.fulfilled;

  //   await expect(
  //     integrationInstance
  //       .connect(stranger)
  //       .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IIntegration')),
  //   ).to.be.fulfilled;

  //   await expect(
  //     integrationInstance
  //       .connect(stranger)
  //       .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IAssetRentabilityMechanics')),
  //   ).to.be.fulfilled;

  // });
}
