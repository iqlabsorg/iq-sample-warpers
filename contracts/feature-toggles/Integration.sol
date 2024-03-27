// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/v1-controller/presets/ERC721ConfigurablePreset.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../external-reward/ExternalRewardWarper.sol";
import "./feature-registry/IntegrationFeatureRegistry.sol";
import "./IIntegration.sol";

/**
 * @title Integration
 * @dev Warper allows a renter to rent an NFT only when their NFT balance for each defined address is zero, this name represents the core functionality quite accurately.
 */
contract Integration is ERC721ConfigurablePreset, IIntegration {
    using Assets for Assets.Asset;

    /**
     * @dev ListingManager contract key.
     */
    bytes4 public immutable LISTING_MANAGER;

    /**
     * @dev RentingManager contract key.
     */
    bytes4 public immutable RENTING_MANAGER;

    /**
     * @dev WarperManager contract key.
     */
    bytes4 public immutable WARPER_MANAGER;

    /**
     * @dev IntegrationFeatureRegistry contract.
     */
    IntegrationFeatureRegistry internal integrationFeatureRegistry;

    /**
     * @dev renter address => tokenId => rentalId.
     */
    mapping(address => mapping(uint256 => uint256)) internal _lastActiveRental;

    /**
     * @dev rentalId => rentalDetails.
     */
    mapping(uint256 => RentalDetails) internal _rentalDetails;

    /**
     * @dev Initializes with IntegrationFeatureRegistry address.
     */
    constructor(bytes memory config) {
        super.__initialize(config);

        (, , address _integrationFeatureRegistry) = abi.decode(config, (address, address, address));

        integrationFeatureRegistry = IntegrationFeatureRegistry(_integrationFeatureRegistry);

        WARPER_MANAGER = Contracts.WARPER_MANAGER;
        LISTING_MANAGER = Contracts.LISTING_MANAGER;
        RENTING_MANAGER = Contracts.RENTING_MANAGER;
    }

    /**
     * @inheritdoc IIntegration
    */
    function executeFeature(bytes4 featureId, IFeatureController.ExecutionObject calldata executionObject)
        public
        returns (bool, string memory)
    {
        address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureId);
        IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);
        (bool success, string memory message) = featureControllerInstance.execute(address(this), executionObject);
        return (success, message);
    }

    /**
     * @inheritdoc IIntegration
    */
    function __onRent(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata rentalEarnings
    ) external virtual override onlyRentingManager returns (bool, string memory) {
        // Save rental details before executing features
        _saveRentalDetails(rentalId, rentalAgreement, rentalEarnings);
        // Get all feature IDs of this integration
        bytes4[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));
        // Execute all features
        for (uint256 i = 0; i < featureIds.length; i++) {
            // Get feature controller address
            address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureIds[i]);
            // Get feature controller instance
            IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);
            // Create execution object
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
            // If any of the features returns false - return false
            if (!featureSuccess) {
                return (false, message);
            }
        }
        // If all features execute successfully, return true
        return (true, "");
    }

    /**
     * @inheritdoc IIntegration
    */
    function checkAll(Rentings.Params calldata rentingParams) public view returns (TokenExecutionResult[] memory results) {
        // Listing Manager and Warper Manager contracts
        IListingManager listingManager = IListingManager(
            IContractRegistry(_metahub()).getContract(LISTING_MANAGER)
        );
        // Listing and Warper data
        Listings.Listing memory listing = listingManager.listingInfo(rentingParams.listingId);
        // All feauture IDs of this integration
        bytes4[] memory featureIds = integrationFeatureRegistry.getEnabledFeatureIds(address(this));
        // Array of execution results for each token ID.
        results = new TokenExecutionResult[](listing.assets.length);
        // For each asset in the listing
        for (uint256 i = 0; i < listing.assets.length; i++) {
            // Extract asset from listing
            Assets.Asset memory asset = listing.assets[i];
            // Decode tokenId from asset ID
            (, uint256 tokenId) = _decodeAssetId(asset.id);
            // Save execution result for each token ID
            results[i] = TokenExecutionResult({
                tokenId: tokenId,
                // Check if the asset is rentable
                executionResult: _checkAllForToken(
                    rentingParams,
                    tokenId,
                    asset.value,
                    featureIds
                )
            });
        }
    }

    /**
     * @inheritdoc IIntegration
    */
    function getFeatureControllerAddress(bytes4 featureId) external view returns (address) {
        return integrationFeatureRegistry.featureControllers(featureId);
    }

    /**
     * @inheritdoc IIntegration
     */
    function getLastActiveRentalId(address renter, uint256 tokenId) public view override returns (uint256) {
        return _lastActiveRental[renter][tokenId];
    }

    /**
     * @inheritdoc IIntegration
     */
    function getRentalDetails(uint256 rentalId)
        public
        view
        override
        returns (RentalDetails memory)
    {
        return _rentalDetails[rentalId];
    }

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IIntegration).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Saves rental details.
     * @param rentalId Rental ID.
     * @param rentalAgreement Rental agreement.
     * @param rentalEarnings Rental earnings.
    */
    function _saveRentalDetails(
        uint256 rentalId,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata rentalEarnings
    ) internal {
        for (uint256 i = 0; i < rentalAgreement.warpedAssets.length; i++) {
            (, uint256 tokenId) = _decodeAssetId(rentalAgreement.warpedAssets[i].id);
            // Latest active rental is persisted.
            _lastActiveRental[rentalAgreement.renter][tokenId] = rentalId;
            // Create rental details struct
            RentalDetails storage rentalDetails = _rentalDetails[rentalId];
            rentalDetails.listingTerms = rentalAgreement.agreementTerms.listingTerms;
            rentalDetails.universeTaxTerms = rentalAgreement.agreementTerms.universeTaxTerms;
            rentalDetails.protocolTaxTerms = rentalAgreement.agreementTerms.protocolTaxTerms;
            rentalDetails.rentalId = rentalId;
            rentalDetails.listingId = rentalAgreement.listingId;
            // Listing Manager
            IListingManager listingManager = IListingManager(
                IContractRegistry(_metahub()).getContract(LISTING_MANAGER)
            );
            // Get lister address
            rentalDetails.lister = listingManager.listingInfo(rentalAgreement.listingId).beneficiary;
            // Get protocol address
            rentalDetails.protocol = IMetahub(_metahub()).protocolExternalFeesCollector();
            // Emit the OnRentHookEvent for every rent
            emit OnRentHookEvent(rentalAgreement.renter, tokenId, rentalId);
        }
    }

    /**
     * @dev Checks if the specified asset with token ID is rentable.
     * @param rentingParams Rentings params.
     * @param tokenId The ID of the asset to check.
     * @param featureIds The IDs of the features to execute.
     * @return executionResults A tuple indicating the success of the operation and an associated message.
     */
    function _checkAllForToken(
        Rentings.Params calldata rentingParams,
        uint256 tokenId,
        uint256 amount,
        bytes4[] memory featureIds
    ) internal view returns (ExecutionResult[] memory executionResults) {
        // Array of execution results for each token ID.
        executionResults = new ExecutionResult[](featureIds.length);

        for (uint256 i = 0; i < featureIds.length; i++) {
            address featureControllerAddress = integrationFeatureRegistry.featureControllers(featureIds[i]);
            IFeatureController featureControllerInstance = IFeatureController(featureControllerAddress);

            IFeatureController.CheckObject memory checkObj = IFeatureController.CheckObject({
                rentingParams: rentingParams,
                tokenId: tokenId,
                amount: amount
            });

            (bool featureSuccess, string memory message) = featureControllerInstance.check(address(this), checkObj);
            executionResults[i] = ExecutionResult(featureIds[i], featureSuccess, message);
        }
    }
}
