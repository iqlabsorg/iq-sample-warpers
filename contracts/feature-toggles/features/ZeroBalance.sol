// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IFeatureController.sol";
import "../IntegrationFeatureRegistry.sol";

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
     * @dev Reverted if the array of zero balance addresses has duplicates.
     */
    error DuplicateValueInZeroBalanceArray();

     /**
     * @dev Emits when zero balance addresses are set.
     * @param zeroBalanceAddresses Zero balance addresses.
     */
    event ZeroBalanceAddressesSet(address[] zeroBalanceAddresses);

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
    function setZeroBalanceAddresses(address integrationAddress, address[] zeroBalanceAddresses) external {
        _zeroBalanceAddresses[integrationAddress] = zeroBalanceAddresses;

        emit ZeroBalanceAddressesSet(zeroBalanceAddresses);
    }

    /**
     * @dev Checks if the renter's balance is zero for all specified collections.
     */
    function check(
        address integrationAddress,
        CheckObject calldata checkObject
    ) external view override returns (bool isRentable, string memory errorMessage) {
        address[] memory zeroBalanceAddresses = _zeroBalanceAddresses[integrationAddress];

        for (uint256 i = 0; i < zeroBalanceAddresses.length; i++) {
            if (IERC721(zeroBalanceAddresses[i]).balanceOf(checkObject.renter) > 0) {
                return (false, "Renter owns NFTs from a restricted collection");
            }
        }

        return (true, "Renter has zero balance for all specified collections");
    }

    /**
     * @dev Executes the feature. Since this is a zero-balance feature, there's no active execution required.
     */
    function execute(
        address,
        ExecutionObject calldata
    ) external override returns (bool success, string memory errorMessage) {
        return (true, "Execution successful");
    }
}
