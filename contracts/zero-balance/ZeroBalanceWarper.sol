// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../external-reward/ExternalRewardWarper.sol";
import "./IZeroBalanceWarper.sol";

/**
 * @title Zero Balance Warper
 * @dev Warper allows a renter to rent an NFT only if their NFT balance for each defined address is zero,
 * this name represents the core functionality quite accurately.
 */
contract ZeroBalanceWarper is IAssetRentabilityMechanics, ExternalRewardWarper, IZeroBalanceWarper {
    /**
     * @dev Array of addresses representing NFT collections that need to be checked in the ZeroBalanceWarper.
     * Renters can only rent if their NFT balance for each collection in this array is zero.
     */
    address[] internal _zeroBalanceCheckAddresses;

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
     * @notice Asset is rentable if the renter holds NFTs from collections in the _zeroBalanceCheckAddresses array.
     */
    function __isRentableAsset(
        address renter,
        uint256,
        uint256
    ) external view virtual override returns (bool isRentable, string memory errorMessage) {
        for (uint256 i = 0; i < _zeroBalanceCheckAddresses.length; i++) {
            if (IERC721(_zeroBalanceCheckAddresses[i]).balanceOf(renter) > 0) {
                return (false, "Renter holds NFTs from restricted collection");
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
