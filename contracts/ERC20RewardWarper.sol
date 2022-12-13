// SPDX-License-Identifier: MIT
// solhint-disable private-vars-leading-underscore
pragma solidity ^0.8.15;

import "@iqprotocol/solidity-contracts-nft/contracts/listing/strategies/fixed-price-with-reward/IFixedPriceWithRewardListingController.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/warper/mechanics/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/warper/ERC721/presets/ERC721PresetConfigurable.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/listing/IListingManager.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/renting/IRentingManager.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/accounting/Accounts.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/renting/Rentings.sol";
import "./auth/Auth.sol";
import "./Rewards.sol";
import "./IERC20RewardWarper.sol";

/// @title Custom Warper for ERC20 Tournament rewarding.
contract ERC20RewardWarper is IERC20RewardWarper, IRentingHookMechanics, ERC721PresetConfigurable, Auth {
    using Rewards for uint256;
    using Rentings for Rentings.Agreement;
    using Accounts for Accounts.RentalEarnings;

    /// @dev The percentile allocation for the universe.
    uint16 internal _universeAllocation;

    /// @dev The percentile allocation for the protocol.
    uint16 internal _protocolAllocation;

    /// @dev Address where the universe rewards gets stored.
    address internal _universeTreasury;

    /// @dev Address where the rewards get taken from.
    address internal _rewardPool;

    /// @dev rentalId => allocations Map of cached allocations for each token.
    mapping(uint256 => CachedAllocation) internal _allocations;

    /// @dev serviceId => tournamentId => player => tokenId => rentalId
    mapping(uint64 => mapping(uint64 => mapping(address => mapping(uint256 => uint256)))) internal _rentalsInTournament;

    /// @dev tokenId => rentalId
    mapping(uint256 => uint256) internal _tokenIdsToRentals;

    /// @dev Constructor for the IQNFTWarper contract.
    constructor(bytes memory config) Auth() warperInitializer {
        super.__initialize(config);
        (, , uint16 universeAllocation, uint16 protocolAllocation, address universeTreasury, address rewardPool) = abi
            .decode(config, (address, address, uint16, uint16, address, address));

        setUniverseAllocation(universeAllocation);
        setProtocolAllocation(protocolAllocation);
        setUniverseTreasury(universeTreasury);
        setRewardPool(rewardPool);
    }

    /// @inheritdoc IERC20RewardWarper
    function disperseRewards(
        uint64 serviceId,
        uint64 tournamentId,
        uint256 tokenId,
        uint256 reward,
        address participant,
        address rewardToken
    ) external onlyAuthorizedCaller {
        uint256 rentalId = _rentalsInTournament[serviceId][tournamentId][participant][tokenId];

        CachedAllocation storage allocation = _allocations[rentalId];
        if (allocation.renter == address(0)) revert AllocationsNotSet();

        // Calculate the reward amounts
        uint256 universeReward = reward.mul(allocation.universeAllocation);
        uint256 protocolReward = reward.mul(allocation.protocolAllocation);
        uint256 listerReward = reward.mul(allocation.listerAllocation);
        uint256 renterReward = reward - universeReward - protocolReward - listerReward;

        // Transfers from the address of Tournament Contract to TRV, Protocol, Lister and Renter treasury addresses
        address[4] memory receivers = [_universeTreasury, _getProtocolTreasury(), allocation.lister, allocation.renter];
        uint256[4] memory rewards = [universeReward, protocolReward, listerReward, renterReward];
        for (uint256 index = 0; index < receivers.length; index++) {
            _transferReward(rewardToken, receivers[index], rewards[index]);
        }
    }

    /// @inheritdoc IERC20RewardWarper
    function onJoinTournament(
        uint64 serviceId,
        uint64 tournamentId,
        address participant,
        uint256 tokenId
    ) external onlyAuthorizedCaller {
        // Make sure that the renal is active!
        if (ownerOf(tokenId) != participant) revert ParticipantIsNotOwnerOfToken();

        // Associate the rentalId with the participant in the tournament.
        // We don't need to worry about the `_tokenIdsToRentals` being outdated
        // because that's already implicitly checked via the ownerOf() call above.
        uint256 rentalId = _tokenIdsToRentals[tokenId];
        _rentalsInTournament[serviceId][tournamentId][participant][tokenId] = rentalId;

        emit JoinedTournament(serviceId, tournamentId, participant, tokenId, rentalId);
    }

    /// @inheritdoc IRentingHookMechanics
    function __onRent(
        uint256 rentalId,
        uint256 tokenId,
        uint256, /* amount */
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyMetahub returns (bool, string memory) {
        // Get allocation information
        CachedAllocation memory allocation = _resolveAllocations(rentalAgreement);

        // Cache the allocation information
        _allocations[rentalId] = allocation;
        _tokenIdsToRentals[tokenId] = rentalId;

        emit AllocationsSet(rentalId, tokenId, allocation);

        // Inform Metahub that everything is fine
        return (true, "");
    }

    /// @inheritdoc IERC20RewardWarper
    function getAllocation(uint256 rentalId) external view returns (CachedAllocation memory) {
        return _allocations[rentalId];
    }

    /// @inheritdoc IERC20RewardWarper
    function getUniverseAllocation() external view returns (uint16) {
        return _universeAllocation;
    }

    /// @inheritdoc IERC20RewardWarper
    function getProtocolAllocation() external view returns (uint16) {
        return _protocolAllocation;
    }

    /// @inheritdoc IERC20RewardWarper
    function getUniverseTreasury() external view returns (address) {
        return _universeTreasury;
    }

    /// @inheritdoc IERC20RewardWarper
    function getRewardPool() external view returns (address) {
        return _rewardPool;
    }

    /// @inheritdoc IERC20RewardWarper
    function setUniverseAllocation(uint16 allocation) public onlyOwner {
        _universeAllocation = allocation;

        emit UniverseAllocationSet(allocation);
    }

    /// @inheritdoc IERC20RewardWarper
    function setProtocolAllocation(uint16 allocation) public onlyOwner {
        _protocolAllocation = allocation;

        emit ProtocolAllocationSet(allocation);
    }

    /// @inheritdoc IERC20RewardWarper
    function setUniverseTreasury(address treasury) public onlyOwner {
        _universeTreasury = treasury;

        emit UniverseTreasurySet(treasury);
    }

    /// @inheritdoc IERC20RewardWarper
    function setRewardPool(address pool) public onlyOwner {
        _rewardPool = pool;

        emit RewardPoolSet(pool);
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            interfaceId == type(IERC20RewardWarper).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _resolveAllocations(Rentings.Agreement calldata rentalAgreement)
        internal
        view
        returns (CachedAllocation memory allocation)
    {
        // Retrieving address of NFT lister from the Listing
        Listings.Listing memory listingInfo = IListingManager(_metahub()).listingInfo(rentalAgreement.listingId);

        allocation = CachedAllocation({
            protocolAllocation: _protocolAllocation,
            universeAllocation: _universeAllocation,
            listerAllocation: 0, // NOTE: this gets set at a further step if needed
            lister: listingInfo.lister,
            renter: rentalAgreement.renter
        });

        if (listingInfo.params.strategy == Listings.FIXED_PRICE_WITH_REWARD) {
            (, uint16 listerAllocation) = IFixedPriceWithRewardListingController(
                IMetahub(_metahub()).listingController(listingInfo.params.strategy)
            ).decodeStrategyParams(listingInfo.params);

            allocation.listerAllocation = listerAllocation;
        }
    }

    // TODO: Metahub needs to be updated to expose such functionality.
    function _getProtocolTreasury() internal view returns (address) {
        // NOTE: using _metahub() because we cannot transfer tokens to address(0)
        return _metahub();
    }

    function _transferReward(
        address rewardToken,
        address to,
        uint256 amount
    ) internal {
        if (amount == 0) return;
        IERC20(rewardToken).transferFrom(_rewardPool, to, amount);
    }
}
