// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IFeatureControllerV2.sol";
import "./IntegrationFeatureRegistry.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";

/**
 * @title  Zero Balance Feature Controller.
 * @notice This contract allows for the management and execution of integration features.
 * @dev Interfaces with IntegrationWrapper for feature operations and Feature Registry for feature registration and status management.
 */
contract MaxDurationFeatureController is IFeatureControllerV2 {
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    IntegrationFeatureRegistry internal integrationFeatureRegistry;

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
     * @dev Initializes the contract with the IntegrationFeatureRegistry address.
     * @param _integrationFeatureRegistry The address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
    }

    function getRentersCount() external view returns (uint256) {
        return _rentersTotalRentalDuration.length();
    }

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

    function execute(address integrationAddress, ExecutionObject calldata executionObject) external override returns (bool success, string memory errorMessage) {
        address renter = executionObject.rentalAgreement.renter;
        _currentRentalEndTimestamp[renter] = executionObject.rentalAgreement.endTime;
        (, uint256 rentalDurationSoFar) = _rentersTotalRentalDuration.tryGet(renter);
        _rentersTotalRentalDuration.set(
            renter,
            uint256(executionObject.rentalAgreement.endTime - executionObject.rentalAgreement.startTime) + rentalDurationSoFar
        );
        // Inform Renting Manager that everything is fine
        return (true, "");
    }

    /**
     * @dev Executes a feature using its keys and returns the associated value.
     * TODO: Logic is under development and will be added soon.
     */
    function check(address integrationAddress, CheckObject calldata checkObject) external view returns (bool isRentable, string memory errorMessage) {
        uint32 currentRentalEndDatetime = _currentRentalEndTimestamp[checkObject.renter];
        if (currentRentalEndDatetime > uint32(block.timestamp)) {
            isRentable = false;
            errorMessage = "Asset is already rented!";
        } else {
            isRentable = true;
            errorMessage = "";
        }
    }


}
