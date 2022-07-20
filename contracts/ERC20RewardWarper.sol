// SPDX-License-Identifier: MIT
// solhint-disable private-vars-leading-underscore
pragma solidity 0.8.15;

import "@iqprotocol/solidity-contracts-nft/contracts/warper/mechanics/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/warper/ERC721/presets/ERC721PresetConfigurable.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/listing/IListingManager.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/renting/IRentingManager.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/accounting/Accounts.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/renting/Rentings.sol";
import "./auth/Auth.sol";
import "./Rewards.sol";

/// @title Custom Warper for ERC20 Tournament rewarding.
contract ERC20RewardWarper is ERC721PresetConfigurable, Auth, IRentingHookMechanics {
    /// @dev Thrown when the tournament winner address does not match the address
    /// of the renter during __onRent() and __onJoinedTournament() hook.
    error WinnerIsNotARenter();

    event UniverseAllocationSet(uint16 allocation);
    event ProtocolAllocationSet(uint16 allocation);
    event UniverseTreasurySet(address treasury);
    event RewardPoolSet(address pool);
    event AllocationsSet(uint256 tokenId, address allocation);

    using Rewards for uint256;
    using Rentings for Rentings.Agreement;
    using Accounts for Accounts.RentalEarnings;

    /// @dev Cached allocation structure.
    /// @param protocolAllocation Reward percentage allocation for protocol.
    /// @param universeAllocation Reward percentage allocation for universe.
    /// @param listerAllocation Reward percentage allocation for lister.
    /// @param lister Address of NFT lister.
    /// @param renter Address of NFT renter.
    struct CachedAllocation {
        uint16 protocolAllocation;
        uint16 universeAllocation;
        uint16 listerAllocation;
        address lister;
        address renter;
    }

    uint16 internal _universeAllocation;
    uint16 internal _protocolAllocation;
    address internal _universeTreasury;
    address internal _rewardPool;
    mapping(uint256 => CachedAllocation) internal _allocations;

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

    /// @dev Executes tournament reward distribution logic after successful setWinner() execution on TRV contract.
    /// @param tokenId The token id that was used.
    /// @param reward The reward amount.
    /// @param rewardToken The reward IERC20 token contract address.
    function disperseRewards(
        uint256 tokenId,
        uint256 reward,
        address rewardToken
    ) external onlyAuthorizedCaller {
        CachedAllocation storage allocation = _allocations[tokenId];
        if (allocation.renter == address(0)) revert WinnerIsNotARenter();

        // TODO consult with Metahub and make sure that the rental is still active.
        //      Otherwise people can claim rewards for inactive rentals.

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

    function __onRent(
        uint256, /* rentalId */
        uint256 tokenId,
        uint256, /* amount */
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata /* rentalEarnings */
    ) external override onlyMetahub returns (bool success, string memory) {
        // Get allocation information
        CachedAllocation memory allocation = _resolveAllocations(rentalAgreement);

        // Cache the allocation information
        _allocations[tokenId] = allocation;
        emit AllocationsSet(tokenId, allocation);

        // Inform Metahub that everything is fine
        success = true;
    }

    function setUniverseAllocation(uint16 allocation) public onlyOwner {
        _universeAllocation = allocation;

        emit UniverseAllocationSet(allocation);
    }

    function setProtocolAllocation(uint16 allocation) public onlyOwner {
        _protocolAllocation = allocation;

        emit ProtocolAllocationSet(allocation);
    }

    function setUniverseTreasury(address treasury) public onlyOwner {
        _universeTreasury = treasury;

        emit UniverseTreasurySet(treasury);
    }

    function setRewardPool(address pool) public onlyOwner {
        _rewardPool = pool;

        emit RewardPoolSet(pool);
    }

    function getAllocation(uint256 tokenId) external view returns (CachedAllocation) {
        return _allocations[tokenId];
    }

    function getUniverseAllocation() external view returns (uint16) {
        return _universeAllocation;
    }

    function getProtocolAllocation() external view returns (uint16) {
        return _protocolAllocation;
    }

    function getUniverseTreasury() external view returns (address) {
        return _universeTreasury;
    }

    function getRewardPool() external view returns (address) {
        return _rewardPool;
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IRentingHookMechanics).interfaceId || super.supportsInterface(interfaceId);
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
            listerAllocation: 0, // NOTE: this gets set at a further step
            lister: listingInfo.lister,
            renter: rentalAgreement.renter
        });

        if (listingInfo.params.strategy == Listings.FIXED_PRICE_WITH_REWARD) {
            // TODO communicate with the listing controller to decode the listers allocation
            (, uint16 listerAllocation) = abi.decode(listingInfo.params.data, (uint256, uint16));
            allocation.listerAllocation = listerAllocation;
        }
    }

    // TODO: Metahub needs to be updated to expose such functionality.
    function _getProtocolTreasury() internal view returns (address) {
        return address(0);
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
