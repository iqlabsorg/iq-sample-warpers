
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../IFeatureController.sol";

interface IFreeTrial is IFeatureController {
    /**
     * @notice Returns the list of token IDs using for free trial.
     * @param integrationAddress The address of Integration.
     * @return An array of IDs.
     */
    function getFreeTrialIDs(address integrationAddress) external view returns (uint256[] memory);

    /**
     * @notice Returns the maximum number of items that a user can rent from free trial list.
     * @param integrationAddress The integration address.
     * @return Renting limit.
     */
    function getFreeTrialLimit(address integrationAddress) external view returns (uint256);

    /**
     * @notice Returns the number of items that user already rented from free trial list.
     * @param integrationAddress The integration address.
     * @param renter The address of the renter whose rental count should be checked.
     * @return Current rental count for specific user.
     */
    function getRentalCount(address integrationAddress, address renter) external view returns (uint256);

    /**
     * @notice Reset the rental count for a specific address.
     * @param integrationAddress The integration address.
     * @param renter The address of the renter whose rental count should be reset.
     */
    function resetRentalCount(address integrationAddress, address renter) external;

    /**
     * @notice Adds free trial list and renting limit for specific integration.
     * @param integrationAddress The integration address.
     * @param freeTrialAddresses The address of the renter whose limit should be reset.
     * @param renterLimit The address of the renter whose limit should be reset.
     */
    function setIntegration(address integrationAddress, address[] memory freeTrialAddresses, uint256 renterLimit) external;

    function _decodeAssetId(Assets.AssetId memory id) internal pure returns (address token, uint256 tokenId) {
        return abi.decode(id.data, (address, uint256));
    }
}
