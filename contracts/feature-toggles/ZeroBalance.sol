// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IFeatureController.sol";
import "./IntegrationFeatureRegistry.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";

/**
 * @title  Zero Balance Feature Controller.
 * @notice This contract allows for the management and execution of integration features.
 * @dev Interfaces with IntegrationWrapper for feature operations and Feature Registry for feature registration and status management.
 */
contract ZeroBalance is IFeatureController {

    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    /**
     * @dev Store an array of addresses that need to be zero balance checked for the specified integration
     * @notice Integration address => zero balance addresses for check
     */
    mapping(address => address[]) private _zeroBalanceAddresses;

    /**
     * @dev Initializes the contract with the IntegrationFeatureRegistry address.
     * @param _integrationFeatureRegistry The address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
    }

    /**
     * @notice Returns the list of zero balance addresses for a given address.
     * @param integrationAddress The address of Integration.
     * @return An array of addresses with zero balance associated with the given integration.
     */
    function getZeroBalanceAddresses(address integrationAddress) external view returns (address[] memory) {
        return _zeroBalanceAddresses[integrationAddress];
    }

    /**
     * @notice Adds a new zero balance address for a given integration.
     * @param integrationAddress The integration address for which the zero balance address needs to be added.
     * @param zeroBalanceAddresses The NFT collection addresses for which the zero balance feature needs to be enabled.
     */
    function setZeroBalanceAddresses(address integrationAddress, address[] calldata zeroBalanceAddresses) external {
        for (uint256 j = 0; j < zeroBalanceAddresses.length; j++) {
            address zeroBalanceAddress = zeroBalanceAddresses[j];

            bool isDuplicate = false;
            // Ensure the address being added isn't already in the list
            for (uint256 i = 0; i < _zeroBalanceAddresses[integrationAddress].length; i++) {
                if (_zeroBalanceAddresses[integrationAddress][i] == zeroBalanceAddress) {
                    isDuplicate = true;
                    break;
                }
            }

            require(!isDuplicate, "One or more addresses are already added"); // should we use here error function?

            _zeroBalanceAddresses[integrationAddress].push(zeroBalanceAddress);
        }
    }

    /**
     * @dev Executes a feature using its keys and returns the associated value.
     * @param integrationAddress The address of the Integration.
     * @param renter Adress of NFT retner
     * TODO: Logic is under development and will be added soon.
     */
    function execute(address renter, address integrationAddress) external view returns (bool isRentable, string memory errorMessage) {
        address[] memory zeroBalanceAddresses = _zeroBalanceAddresses[integrationAddress];

        for (uint256 i = 0; i < zeroBalanceAddresses.length; i++) {
            if (IERC721(zeroBalanceAddresses[i]).balanceOf(renter) > 0) {
                return (false, "Renter has no NFTs on the balance");
            }
        }

        return (true, "");
    }


}
