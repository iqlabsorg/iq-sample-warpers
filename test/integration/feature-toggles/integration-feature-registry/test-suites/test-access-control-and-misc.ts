import { SolidityInterfaces, IntegrationFeatureRegistry } from '../../../../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { getSolidityInterfaceId } from '../../../../shared/utils/solidity-interfaces';
import {
  ADDRESS_ZERO,
  EMPTY_BYTES32_DATA_HEX,
  EMPTY_BYTES4_DATA_HEX,
  EMPTY_BYTES_DATA_HEX,
} from '@iqprotocol/iq-space-protocol';

export function testAccessControlAndMisc(): void {
  /**** Contracts ****/
  let integrationFeatureRegistryInstance: IntegrationFeatureRegistry;
  /**** Mocks & Samples ****/
  let solidityInterfaces: SolidityInterfaces;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let registryOwner: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async function () {
    /**** Contracts ****/
    integrationFeatureRegistryInstance = this.contracts.integrationFeatureRegistryInstance;
    /**** Mocks & Samples ****/
    solidityInterfaces = this.mocks.misc.solidityInterfaces;
    /**** Signers ****/
    deployer = this.signers.named.deployer;
    [registryOwner, authorizedCaller, stranger] = this.signers.unnamed;
  });

  //CHECK INTERFACES SUPPORT

  it('supports necessary interfaces', async () => {
    // Check for the interfaces that IntegrationFeatureRegistry is expected to implement.
    await expect(
      integrationFeatureRegistryInstance
        .connect(stranger)
        .supportsInterface(await getSolidityInterfaceId(solidityInterfaces, 'IFeatureController')),
    ).to.be.fulfilled;

    //ADD MORE INTERFACES

  });
}
