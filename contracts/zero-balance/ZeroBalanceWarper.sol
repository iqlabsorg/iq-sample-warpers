// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../external-reward/ExternalRewardWarper.sol";
import "./IZeroBalanceWarper.sol";

/**
 * @title Zero Balance Warper
 * @dev Warper allows a renter to rent an NFT only when their NFT balance for each defined address is zero, this name represents the core functionality quite accurately.
 */
contract ZeroBalanceWarper is IAssetRentabilityMechanics, ExternalRewardWarper, IZeroBalanceWarper {
    /**
     * @dev A state variable to store an array of addresses that need to be checked in the ZeroBalanceWarper.
     * Each address in this array represents a user that we need to verify whether they hold any NFTs or not.
     * A user can rent an NFT only if their balance for each address in this array is zero.
     */
    address[] private _zeroBalanceCheckAddresses;

    /**
     * @dev Constructor for the ZeroBalanceWarper contract.
     */
    constructor(bytes memory config) ExternalRewardWarper(config) {
        (, , , address[] memory zeroBalanceCheckAddresses) = abi.decode(config, (address, address, address, address[]));

        setZeroBalanceAddresses(zeroBalanceCheckAddresses);
    }

    /**
     * @inheritdoc IZeroBalanceWarper
     */
    function setZeroBalanceAddresses(address[] memory zeroBalanceCheckAddresses) public override onlyOwner {
        _zeroBalanceCheckAddresses = zeroBalanceCheckAddresses;

        emit ZeroBalanceAddressesSet(zeroBalanceCheckAddresses);
    }

    /**
     * @inheritdoc IAssetRentabilityMechanics
     * @notice The asset is rentable when the renter has no Universus NFTs.
     */
    function __isRentableAsset(
        address renter,
        uint256,
        uint256
    ) external view override returns (bool isRentable, string memory errorMessage) {
        for (uint256 i = 0; i < _zeroBalanceCheckAddresses.length; i++) {
            if (IERC721(_zeroBalanceCheckAddresses[i]).balanceOf(renter) > 0) {
                return (false, "Renter has NFTs on the balance");
            }
        }

        return (true, "");
    }

    /**
     * @inheritdoc IZeroBalanceWarper
     */
    function getZeroBalanceAddresses() public view override returns (address[] memory) {
        return _zeroBalanceCheckAddresses;
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IAssetRentabilityMechanics).interfaceId ||
            interfaceId == type(IZeroBalanceWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
