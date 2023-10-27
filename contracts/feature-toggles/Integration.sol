// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../external-reward/ExternalRewardWarper.sol";
import "./feature-registry/IntegrationFeatureRegistry.sol";
import "./IIntegration.sol";

/**
 * @title Integration
 * @dev Warper allows a renter to rent an NFT only when their NFT balance for each defined address is zero, this name represents the core functionality quite accurately.
 */
contract Integration is ExternalRewardWarper, IIntegration {
    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    /**
     * @dev Initializes with IntegrationFeatureRegistry address.
     */
    constructor(bytes memory config) ExternalRewardWarper(config) {
        (, , , address _integrationFeatureRegistry) = abi.decode(config, (address, address, address, address));

        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);
    }

    function executeFeature(bytes4 featureId, IFeatureController.ExecutionObject calldata executionObject)
        public
        returns (bool, string memory)
    {
        address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureId);
        IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);
        (bool success, string memory message) = featureControllerInstance.execute(address(this), executionObject);
        return (success, message);
    }

    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata rentalEarnings
    ) external override(ExternalRewardWarper, IIntegration) onlyRentingManager returns (bool, string memory) {
        for (uint256 i = 0; i < rentalAgreement.warpedAssets.length; i++) {
            (, uint256 tokenId) = _decodeAssetId(rentalAgreement.warpedAssets[i].id);
            // Latest active rental is persisted.
            _lastActiveRental[rentalAgreement.renter][tokenId] = rentalId;

            RentalDetails storage rentalDetails = _rentalDetails[rentalId];
            rentalDetails.listingTerms = rentalAgreement.agreementTerms.listingTerms;
            rentalDetails.universeTaxTerms = rentalAgreement.agreementTerms.universeTaxTerms;
            rentalDetails.protocolTaxTerms = rentalAgreement.agreementTerms.protocolTaxTerms;
            rentalDetails.rentalId = rentalId;
            rentalDetails.listingId = rentalAgreement.listingId;

            IListingManager listingManager = IListingManager(
                IContractRegistry(_metahub()).getContract(LISTING_MANAGER)
            );

            rentalDetails.lister = listingManager.listingInfo(rentalAgreement.listingId).beneficiary;
            rentalDetails.protocol = IMetahub(_metahub()).protocolExternalFeesCollector();

            // Emit the OnRentHookEvent for every rent
            emit OnRentHookEvent(rentalAgreement.renter, tokenId, rentalId);
        }

        bytes4[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));

        for (uint256 i = 0; i < featureIds.length; i++) {
            address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureIds[i]);
            IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);

            IFeatureController.ExecutionObject memory executionObject = IFeatureController.ExecutionObject({
                rentalId: rentalId,
                rentalAgreement: rentalAgreement,
                rentalEarnings: rentalEarnings
            });

            // Execute the feature with the executionObject
            (bool featureSuccess, string memory message) = featureControllerInstance.execute(
                address(this),
                executionObject
            );

            if (!featureSuccess) {
                return (false, message); // if any of the features returns false - return false
            }
        }

        // If all features execute successfully, return true
        return (true, "");
    }

    /**
     * @notice The asset is rentable when all feature-checks passed with true.
     * @dev This function redesigns original __isRentableAsset
     * Main protocol should be updated to include new __isRentableAsset
     */
    function __isRentableAsset(
        Rentings.Params calldata rentingParams,
        uint256 tokenId,
        uint256 amount
    ) external view onlyRentingManager returns (bool isRentable, string memory errorMessage) {
        // Fetching the enabled featureIds for this integration.
        bytes4[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));

        for (uint256 i = 0; i < featureIds.length; i++) {
            address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureIds[i]);
            IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);

            IFeatureController.CheckObject memory checkObj = IFeatureController.CheckObject({
                rentingParams: rentingParams,
                tokenId: tokenId,
                amount: amount
            });

            (bool featureSuccess, string memory message) = featureControllerInstance.check(address(this), checkObj);
            if (!featureSuccess) {
                return (false, message);
            }
        }

        return (true, "");
    }

    /**
     * @notice Checks the rentability of an asset against all active features.
     * @param rentingParams Renting params.
     * @param tokenId ID of the token to be rented.
     * @param amount Amount of tokens/units to rent.
     * @return results Array of execution results for each feature checked. Each result contains the ID of the feature, its success state, and an associated message.
     */
    function checkAll(
        Rentings.Params calldata rentingParams,
        uint256 tokenId,
        uint256 amount
    ) public view returns (ExecutionResult[] memory results) {
        // Fetching the enabled featureIds for this integration.
        bytes4[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));
        ExecutionResult[] memory resultsArray = new ExecutionResult[](featureIds.length);

        for (uint256 i = 0; i < featureIds.length; i++) {
            address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureIds[i]);
            IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);

            IFeatureController.CheckObject memory checkObj = IFeatureController.CheckObject({
                rentingParams: rentingParams,
                tokenId: tokenId,
                amount: amount
            });

            (bool featureSuccess, string memory message) = featureControllerInstance.check(address(this), checkObj);
            resultsArray[i] = ExecutionResult(featureIds[i], featureSuccess, message);
        }

        return resultsArray;
    }

    /**
     * @dev Retrieves the address of a feature controller.
     * @param featureId Feature's ID.
     * @return Feature controller's address.
     */
    function getFeatureControllerAddress(bytes4 featureId) external view returns (address) {
        return integrationFeatureRegistry.featureControllers(featureId);
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IAssetRentabilityMechanics).interfaceId ||
            // interfaceId == type(IZeroBalanceWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
