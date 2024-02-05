// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../FeatureController.sol";
import "./IFreeTrial.sol";

/**
 * @title Free Trial Feature Controller.
 * @notice This contract enables the management and execution of integration features.
 * @dev Free trial.
 */
contract FreeTrial is FeatureController, IFreeTrial {

    /**
     * @dev Emits when free trial are set for integration.
     * @param integrationAddress The address of Integration.
     */
    event FreeTrialSet(address integrationAddress);

    /**
     * @dev Store an array of free trial IDs
     * @notice IntegrationAddress => freeTrialIDs
     */
    mapping(address => uint256[]) private _freeTrialIDs;

    /**
     * @dev Store an renter limit for the specified integration
     * @notice IntegrationAddress => renterLimit
     */
    mapping(address => uint256) private _renterLimit;

    /**
     * @dev Store an rental count for each renter
     * @notice IntegrationAddress => renter => rentalCount
     */
    mapping(address => mapping(address => uint256)) private _rentalCount;

    /**
     * @dev Initializes the contract with the IntegrationFeatureRegistry address.
     * @param integrationFeatureRegistry The address of IntegrationFeatureRegistry.
     */
    constructor(address integrationFeatureRegistry) {
        _integrationFeatureRegistry = IntegrationFeatureRegistry(integrationFeatureRegistry);
        _featureId = bytes4(keccak256("FreeTrial"));
    }

    /**
     * @notice Returns the list of token ID used for the free trial.
     * @param integrationAddress The address of the integration.
     * @return An array of IDs.
     */
    function getFreeTrialIDs(address integrationAddress) external view override returns (uint256[] memory) {
        return _freeTrialIDs[integrationAddress];
    }

    /**
     * @notice Returns the maximum number of items that a user can rent from the free trial list.
     * @param integrationAddress The integration address.
     * @return Rental limit.
     */
    function getFreeTrialLimit(address integrationAddress) external view override returns (uint256) {
        return _renterLimit[integrationAddress];
    }

    /**
     * @notice Returns the number of items that a user has already rented from the free trial list.
     * @param integrationAddress The integration address.
     * @param renter The address of the renter whose rental count should be checked.
     * @return Current rental count for a specific user.
     */
    function getRentalCount(address integrationAddress, address renter) external view override returns (uint256) {
        return _rentalCount[integrationAddress][renter];
    }


    /**
     * @notice Adds free trial list and renting limit for a specific integration.
     * @param integrationAddress The integration address.
     * @param freeTrialIDs The IDs for the free trial list.
     * @param renterLimit The maximum number of items a user can rent from the free trial list.
     */
    function setIntegration(address integrationAddress, uint256[] memory freeTrialIDs, uint256 renterLimit)
        external  onlyAuthorizedIntegrationOwner(integrationAddress)
    {
        _freeTrialIDs[integrationAddress] = freeTrialIDs;
        _renterLimit[integrationAddress] = renterLimit;

        emit FreeTrialSet(integrationAddress);
    }

    /**
     * @notice Reset the rental count for a specific address.
     * @param integrationAddress The integration address.
     * @param renter The address of the renter whose rental count should be reset.
     */
    function resetRentalCount(address integrationAddress, address renter)
        external onlyAuthorizedIntegrationOwner(integrationAddress)
    {
        _rentalCount[integrationAddress][renter] = 0;
    }

    /**
     * @dev Checks if a tokenId is in the free trial list for a given integration.
     * @param integrationAddress The integration address.
     * @param tokenId The tokenId to check.
     * @param freeTrialIDs The array of free trial token IDs.
     * @return True if the tokenId is in the free trial list.
     */
    function _isInFreeTrialList(address integrationAddress, uint256 tokenId, uint256[] memory freeTrialIDs)
        internal pure returns (bool)
    {
        for (uint256 i = 0; i < freeTrialIDs.length; i++) {
            if (freeTrialIDs[i] == tokenId) {
                return true;
            }
        }
        return false;
    }



    /**
     * @dev Executes the feature. Since this is a zero-balance feature, there's no active execution required.
     */
    function execute(address integrationAddress, ExecutionObject calldata executionObject)
        external
        override
        onlyIntegration(integrationAddress)
        returns (bool success, string memory errorMessage)
    {

        address renter = executionObject.rentalAgreement.renter;

        uint256[] memory freeTrialIDs = _freeTrialIDs[integrationAddress];

        uint256 renterLimit = _renterLimit[integrationAddress];

        uint256 rentalCount = _rentalCount[integrationAddress][renter];

        for (uint256 i = 0; i < executionObject.rentalAgreement.warpedAssets.length; i++) {
                (, uint256 tokenId) = _decodeAssetId(executionObject.rentalAgreement.warpedAssets[i].id);

                if (!_isInFreeTrialList(integrationAddress, tokenId, freeTrialIDs)) {
                    return (true, "Renter pass free trial requirements");
                } else {
                    //is renter don't reach limit?
                    if (rentalCount < renterLimit) {
                        _rentalCount[integrationAddress][renter]++;
                        return (true, "Renter pass free trial requirements");
                    } else {
                        return (false, "Renter reach rental limit");
                    }
                }

            }
    }

    function _decodeAssetId(Assets.AssetId memory id) internal pure returns (address token, uint256 tokenId) {
        return abi.decode(id.data, (address, uint256));
    }

    function check(address integrationAddress, CheckObject calldata checkObject)
        external
        view
        override
        returns (bool isRentable, string memory errorMessage)
    {
        isRentable = true;
        errorMessage = "Check successful";
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(FeatureController, IERC165) returns (bool) {
        return interfaceId == type(IFreeTrial).interfaceId ||
        super.supportsInterface(interfaceId);
    }
}
