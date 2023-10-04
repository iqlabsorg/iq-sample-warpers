// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IFeatureController.sol";
import "./IntegrationFeatureRegistry.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";

/**
 * @title Minimum Thresholds Feature Controller
 * @notice Manages required NFT collection holdings for eligibility criteria.
 * @dev Interacts with the IntegrationWrapper for feature operations and storage.
 */
contract MinimumThreshold is IFeatureController {
    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    // Stores the NFT collection addresses a user needs to own to be eligible.
    mapping(address => address[]) private _requiredCollectionAddresses;

    // Defines the minimum number of NFTs a user needs to hold from the respective collections.
    mapping(address => uint256[]) private _requiredCollectionMinimumThresholds;

    /// @notice Maps a renter's address to their respective rental end timestamp.
    /// @dev Used to track when a renter's current rental agreement expires.
    mapping(address => uint32) private _currentRentalEndTimestamp;

    /**
     * @dev Sets the address for the IntegrationFeatureRegistry.
     * @param _integrationFeatureRegistry Address of IntegrationFeatureRegistry.
     */
    constructor(address _integrationFeatureRegistry) {
        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
    }

    /**
     * @notice Fetches required collection addresses for an integration.
     * @param integrationAddress Address of integration.
     * @return List of required collection addresses.
     */
    function getRequiredCollectionAddresses(address integrationAddress) external view returns (address[] memory) {
        return _requiredCollectionAddresses[integrationAddress];
    }

    /**
     * @notice Fetches required NFT holdings for an integration.
     * @param integrationAddress Address of integration.
     * @return List of required NFT counts for each collection.
     */
    function getRequiredCollectionMinimumThresholds(
        address integrationAddress
    ) external view returns (uint256[] memory) {
        return _requiredCollectionMinimumThresholds[integrationAddress];
    }

    /**
     * @notice Sets the required NFT collections and their minimum holdings.
     * @param integrationAddress Address of integration.
     * @param collectionAddresses List of required collection addresses.
     * @param minimumThresholds Required NFT counts for each collection.
     */
    function setIntegration(
        address integrationAddress,
        address[] calldata collectionAddresses,
        uint256[] calldata minimumThresholds
    ) external {
        require(collectionAddresses.length == minimumThresholds.length, "Mismatched array lengths");

        _requiredCollectionAddresses[integrationAddress] = collectionAddresses;
        _requiredCollectionMinimumThresholds[integrationAddress] = minimumThresholds;
    }

    /**
     * @notice Executes the feature to check if a renter has the required NFTs.
     * @param integrationAddress The IntegrationWrapper address.
     * @param executionObject Object containing details about the rental agreement.
     */
    function execute(
        address integrationAddress,
        ExecutionObject calldata executionObject
    ) external override returns (bool success, string memory errorMessage) {
        address renter = executionObject.rentalAgreement.renter;
        address[] memory requiredAddresses = _requiredCollectionAddresses[integrationAddress];
        uint256[] memory requiredThresholds = _requiredCollectionMinimumThresholds[integrationAddress];

        for (uint256 i = 0; i < requiredAddresses.length; i++) {
            if (IERC721(requiredAddresses[i]).balanceOf(renter) < requiredThresholds[i]) {
                return (false, "Renter has not enough NFTs from required collections");
            }
        }
        return (true, "");
    }

    function check(
        address integrationAddress,
        CheckObject calldata checkObject
    ) external view override returns (bool isRentable, string memory errorMessage) {
        address renter = checkObject.renter; // Получите адрес арендатора из CheckObject
        uint32 currentRentalEndDatetime = _currentRentalEndTimestamp[renter];
        if (currentRentalEndDatetime > uint32(block.timestamp)) {
            return (false, "Asset is already rented!");
        }
        return (true, "");
    }
}
