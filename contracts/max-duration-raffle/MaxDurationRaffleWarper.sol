// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/renting-manager/IRentingManager.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

import "./IMaxDurationRaffleWarper.sol";

/**
 * @title Custom Warper for raffling .
 */
contract MaxDurationRaffleWarper is
    IMaxDurationRaffleWarper,
    IRentingHookMechanics,
    IAssetRentabilityMechanics,
    ERC721ConfigurablePreset
{
    using EnumerableMap for EnumerableMap.AddressToUintMap;
    /**
     * @dev renter => uint256 (renter's current asset rental end datetime in seconds).
     */
    mapping(address => uint32) internal _currentRentalEndDatetime;

    EnumerableMap.AddressToUintMap internal _rentersTotalRentalDuration;

    /**
     * @dev Constructor for the IQNFTWarper contract.
     */
    constructor(bytes memory config) warperInitializer {
        super.__initialize(config);
    }

    /**
     * @inheritdoc IAssetRentabilityMechanics
     */
    function __isRentableAsset(
        address renter,
        uint256,
        uint256
    ) external view override returns (bool isRentable, string memory errorMessage) {
        uint32 currentRentalEndDatetime = _currentRentalEndDatetime[renter];
        if (currentRentalEndDatetime > uint32(block.timestamp)) {
            isRentable = false;
            errorMessage = "Asset is already rented!";
        } else {
            isRentable = true;
            errorMessage = "";
        }
    }

    /**
     * @inheritdoc IRentingHookMechanics
     */
    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyRentingManager returns (bool, string memory) {
        address renter = rentalAgreement.renter;
        _currentRentalEndDatetime[renter] = rentalAgreement.endTime;
        (, uint256 rentalDurationSoFar) = _rentersTotalRentalDuration.tryGet(renter);
        _rentersTotalRentalDuration.set(
            renter,
            uint256(rentalAgreement.endTime - rentalAgreement.startTime) + rentalDurationSoFar
        );
        // Inform Renting Manager that everything is fine
        return (true, "");
    }

    /**
     * @inheritdoc IMaxDurationRaffleWarper
     */
    function getRentersCount() external view returns (uint256) {
        return _rentersTotalRentalDuration.length();
    }

    /**
     * @inheritdoc IMaxDurationRaffleWarper
     */
    function getTotalRentalDurations(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory renterAddresses, uint256[] memory totalRentalDurations)
    {
        uint256 indexSize = _rentersTotalRentalDuration.length();
        if (offset >= indexSize) return (new address[](0), new uint256[](0));

        if (limit > indexSize - offset) {
            limit = indexSize - offset;
        }

        renterAddresses = new address[](limit);
        totalRentalDurations = new uint256[](limit);

        for (uint256 i = 0; i < limit; i++) {
            (address renter, uint256 totalRentalDuration) = _rentersTotalRentalDuration.at(offset + i);
            renterAddresses[i] = renter;
            totalRentalDurations[i] = totalRentalDuration;
        }
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IAssetRentabilityMechanics).interfaceId ||
            interfaceId == type(IMaxDurationRaffleWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
