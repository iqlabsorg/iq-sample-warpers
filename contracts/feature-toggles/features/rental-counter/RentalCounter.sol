// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

import "../FeatureController.sol";
import "./IRentalCounter.sol";

/**
 * @title Rental Counter Feature Controller.
 * @notice Custom feature for counting rental duration of each renter for specific integration.
 */
contract MaxDurationRaffle is FeatureController, IRentalCounter {
    IntegrationFeatureRegistry internal integrationFeatureRegistry;
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    /**
     * @dev Stores total rental duration for each integration.
     */
    mapping(address => EnumerableMap.AddressToUintMap) internal _rentersTotalRentalDuration;

    /**
     * @dev Stores current rental end timestamp for each renter in specific integration.
     * @notice integration address => renter => uint256 (renter's current asset rental end timestamp).
     */
    mapping(address => mapping(address => uint32)) internal _currentRentalEndTimestamp;

    /**
     * @dev Sets the address for the IntegrationFeatureRegistry.
     * @param _integrationFeatureRegistry Address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
        _featureId = bytes4(keccak256("MaxDurationRaffle"));
    }

    /**
     * @inheritdoc IRentalCounter
     */
    function getRentersCount(address integrationAddress) external view returns (uint256) {
        return _rentersTotalRentalDuration[integrationAddress].length();
    }

    /**
     * @inheritdoc IRentalCounter
     */
    function getTotalRentalDurations(
        address integrationAddress,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory renterAddresses, uint256[] memory totalRentalDurations) {
        uint256 indexSize = _rentersTotalRentalDuration[integrationAddress].length();
        if (offset >= indexSize) return (new address[](0), new uint256[](0));

        if (limit > indexSize - offset) {
            limit = indexSize - offset;
        }

        renterAddresses = new address[](limit);
        totalRentalDurations = new uint256[](limit);

        for (uint256 i = 0; i < limit; i++) {
            (address renter, uint256 totalRentalDuration) = _rentersTotalRentalDuration[integrationAddress].at(
                offset + i
            );
            renterAddresses[i] = renter;
            totalRentalDurations[i] = totalRentalDuration;
        }
    }

    /**
     * @inheritdoc IFeatureController
     */
    function check(
        address integrationAddress,
        CheckObject calldata checkObject
    ) external view override returns (bool isRentable, string memory errorMessage) {
        isRentable = true;
        errorMessage = "Check successful";
    }

    /**
     * @inheritdoc IFeatureController
     */
    function execute(
        address integrationAddress,
        ExecutionObject calldata executionObject
    ) external override onlyIntegration(integrationAddress) returns (bool success, string memory errorMessage) {
        address renter = executionObject.rentalAgreement.renter;
        uint32 currentRentalEndDatetime = _currentRentalEndTimestamp[integrationAddress][renter];

        if (currentRentalEndDatetime > uint32(block.timestamp)) {
            return (false, "Asset is already rented!");
        } else {
            _currentRentalEndTimestamp[integrationAddress][renter] = executionObject.rentalAgreement.endTime;
            (, uint256 rentalDurationSoFar) = _rentersTotalRentalDuration[integrationAddress].tryGet(renter);
            _rentersTotalRentalDuration[integrationAddress].set(
            renter,
            uint256(executionObject.rentalAgreement.endTime - executionObject.rentalAgreement.startTime) +
                rentalDurationSoFar
        );
            return (true, "");
        }
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(FeatureController, IERC165) returns (bool) {
        return interfaceId == type(IRentalCounter).interfaceId ||
        super.supportsInterface(interfaceId);
    }
}