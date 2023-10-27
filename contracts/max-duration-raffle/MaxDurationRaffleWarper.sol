// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/renting/renting-manager/IRentingManager.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

import "./IMaxDurationRaffleWarper.sol";

/**
 * @title Custom Warper for marketing raffle with max duration algorythm.
 */
contract MaxDurationRaffleWarper is
    IMaxDurationRaffleWarper,
    IRentingHookMechanics,
    IAssetRentabilityMechanics,
    ERC721ConfigurablePreset
{
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    /**
     * @dev Reverts when maxDuration - minDuration != 2.
     */
    error InvalidRaffleRentalPeriods(uint32 minDuration, uint32 maxDuration);

    /**
     * @dev Stores current rental end timestamp for each renter.
     * @notice renter => uint256 (renter's current asset rental end timestamp).
     */
    mapping(address => uint32) internal _currentRentalEndTimestamp;

    /**
     * @dev Stores total rental duration for each renter.
     */
    EnumerableMap.AddressToUintMap internal _rentersTotalRentalDuration;

    /**
     * @dev Constructor for the MaxDurationRaffleWarper contract.
     */
    constructor(bytes memory config) warperInitializer {
        super.__initialize(config);

        // minDuration and maxDuration are required here in order to provide
        // a way to set an equal raffle rules for everyone.
        // e.g. minDuration = 3600 (1 hour in seconds)
        // e.g. maxDuration = 3600 (1 hour in seconds)
        // Also this should be acknowledged during the listing creation.
        // So all listings created should max lock period equal to 3600 seconds (1 day).
        (, , uint32 minDuration, uint32 maxDuration) = abi.decode(config, (address, address, uint32, uint32));

        if (minDuration != maxDuration) revert InvalidRaffleRentalPeriods(minDuration, maxDuration);

        _setRentalPeriods(minDuration, maxDuration);
    }

    /**
     * @inheritdoc IAssetRentabilityMechanics
     */
    function __isRentableAsset(
        address renter,
        uint256,
        uint256
    ) external view override returns (bool isRentable, string memory errorMessage) {
        uint32 currentRentalEndDatetime = _currentRentalEndTimestamp[renter];
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
        uint256,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyRentingManager returns (bool, string memory) {
        address renter = rentalAgreement.renter;
        _currentRentalEndTimestamp[renter] = rentalAgreement.endTime;
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
            interfaceId == type(IRentalPeriodMechanics).interfaceId ||
            interfaceId == type(IMaxDurationRaffleWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
