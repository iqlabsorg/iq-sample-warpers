// SPDX-License-Identifier: MIT
// solhint-disable private-vars-leading-underscore
pragma solidity 0.8.15;

import "@iqprotocol/solidity-contracts-nft/contracts/warper/mechanics/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/warper/ERC721/presets/ERC721PresetConfigurable.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/listing/IListingManager.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/accounting/Accounts.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/renting/Rentings.sol";
import "./mock/MockAllocationResolver.sol";
import "./tournament/Tournament.sol";
import "./mock/MockMetahub.sol";
import "./auth/Auth.sol";

/// @title Custom Warper for ERC20 Tournament rewarding.
contract ERC20RewardWarper is
    ERC721PresetConfigurable,
    Tournament,
    Auth,
    IRentingHookMechanics
{
    /// @dev Thrown when the tournament winner address does not match the address
    /// of the renter during __onRent() and __onJoinedTournament() hook.
    error WinnerIsNotARenter();

    using Rentings for Rentings.Agreement;
    using Accounts for Accounts.RentalEarnings;

    /// @dev Address of mocked The Red Village Tournament contract.
    /// TODO Should be renamed to Tournament for production implementation
    address internal _mockTournament;

    /// @dev Address of mocked IQ Protocol protocol, universe and lister allocation percentage Resolver smart contract.
    /// TODO Should be deleted, once AllocationResolver() is implemented on IQ Protocol
    address internal _mockAllocationsResolver;

    /// @dev Address of mocked IQ Protocol Metahub smart contract.
    /// TODO Should be deleted, once getTreasuryAddress() is implemented on IQ Protocol Metahub
    address internal _mockMetahub;

    /// @dev Address of The Red Village treasury for tournament rewards.
    address internal _universeTreasury;

    /// @dev Constructor for the IQNFTWarper contract.
    /// @param config abi.encoded bytes of the following structure:
    ///         (address original, address metahub, address mockTournament,
    ///         address mockAllocationResolver, address mockMetahub, address universeTreasury)
    constructor(bytes memory config) warperInitializer {
        super.__initialize(config);

        (
            ,
            ,
            address mockTournament,
            address mockAllocationResolver,
            address mockMetahub,
            address universeTreasury
        ) = abi.decode(
                config,
                (address, address, address, address, address, address)
            );

        _mockTournament = mockTournament;
        _mockAllocationsResolver = mockAllocationResolver;
        _mockMetahub = mockMetahub;
        _universeTreasury = universeTreasury;
    }

    /// @dev onRent hook implementation for IRentingHookMechanics.
    /// NOTE: This function should not revert directly and must set correct `success` value instead.
    /// 1. Will calculate the reward allocation for the protocol, universe and lister.
    /// 2. Will assign rental ID for renter and token ID.
    /// The hook will not make assertions to make sure that the user can or cannot rent.
    function __onRent(
        uint256 rentalId,
        uint256 tokenId,
        uint256,
        Rentings.Agreement calldata rentalAgreement,
        Accounts.RentalEarnings calldata
    ) external override onlyMetahub returns (bool success, string memory) {
        // Checking that rental with ID exists
        // Rental ID always bigger than zero
        if (rentalId == 0) revert RentalDoesNotExists();
        /// Retrieving reward allocation shares for Protocol, Universe and Lister from
        /// From the mock contract of AllocationResolver
        (
            uint16 protocolAllocation,
            uint16 universeAllocation,
            uint16 listerAllocation
        ) = MockAllocationResolver(_mockAllocationsResolver).getAllocations(
                rentalId
            );

        // Retrieving address of NFT lister from the Listing
        address lister = IListingManager(_metahub())
            .listingInfo(rentalAgreement.listingId)
            .lister;

        // Saving allocations data
        _setAllocations(
            rentalId,
            protocolAllocation,
            universeAllocation,
            listerAllocation,
            lister,
            rentalAgreement.renter
        );

        // Saving binding between (renter + rented asset token ID) and pointing it to rental ID
        _setRentalForToken(rentalAgreement.renter, tokenId, rentalId);

        success = true;
    }

    /// @dev Executes tournament post-registration logic after successful joinTournament() execution on TRV contract.
    /// NOTE: This function should not revert directly and must set correct `success` value instead.
    /// @param tournamentId TRV Tournament ID.
    /// @param participant The participant address.
    /// @param tokenId The token ID.
    /// @return success True if hook was executed successfully.
    /// @return errorMessage The reason of the hook execution failure.
    function __onJoinedTournament(
        uint256 tournamentId,
        address participant,
        uint256 tokenId
    ) external onlyAuthorizedCaller returns (bool success, string memory) {
        // Registering participant for tournament with certain token ID of rented asset
        _registerForTournament(tournamentId, participant, tokenId);
        success = true;
    }

    /// @dev Executes tournament reward distribution logic after successful setWinner() execution on TRV contract.
    /// NOTE: This function should not revert directly and must set correct `success` value instead.
    /// @param tournamentId TRV Tournament ID.
    /// @param winner The tournament winner address.
    /// @param reward The reward amount.
    /// @param rewardToken The IERC20Upgradeable token for rewarding
    /// @return success True if hook was executed successfully.
    /// @return errorMessage The reason of the hook execution failure.
    function __onDistribution(
        uint256 tournamentId,
        address winner,
        uint256 reward,
        address rewardToken
    ) external onlyAuthorizedCaller returns (bool success, string memory) {
        require(reward > 0 && rewardToken != address(0));
        // Retrieving token ID
        uint256 tokenId = getTournamentRegistration(tournamentId, winner);

        // Retrieving rental ID
        uint256 rentalId = getRentalForToken(winner, tokenId);

        address renter = _allocations[rentalId].renter;

        // Check that renter has the same address as winner
        if (renter != winner) revert WinnerIsNotARenter();

        // Retrieve protocol treasury address from the MockMetahub contract
        // getTreasuryAddress for Metahub would be implemented soon
        // TODO change MockMetahub to IMetahub once getTreasuryAddress implementation is ready
        address protocolTreasury = MockMetahub(_mockMetahub)
            .getTreasuryAddress();

        // Allowance checks should occur on TRV Tournament contract
        // TODO Change formula according to TRV requirements, once they're present
        uint256 universeReward = (reward / 10_000) *
            _allocations[rentalId].universeAllocation;
        uint256 protocolReward = (reward / 10_000) *
            _allocations[rentalId].protocolAllocation;
        uint256 listerReward = (reward / 10_000) *
            _allocations[rentalId].listerAllocation;
        uint256 renterReward = reward -
            universeReward -
            protocolReward -
            listerReward;

        // No need to setup checks for reward - (universeReward + protocolReward + listerReward) > 0
        // Because, assuming formula above is working correctly from the side of The Red Village
        // It should not be issues with renter reward

        // Transfers from the address of Tournament Contract to TRV, Protocol, Lister and Renter treasury addresses
        IERC20Upgradeable(rewardToken).transferFrom(
            _mockTournament,
            _universeTreasury,
            universeReward
        );
        IERC20Upgradeable(rewardToken).transferFrom(
            _mockTournament,
            protocolTreasury,
            protocolReward
        );
        IERC20Upgradeable(rewardToken).transferFrom(
            _mockTournament,
            _allocations[rentalId].lister,
            listerReward
        );
        IERC20Upgradeable(rewardToken).transferFrom(
            _mockTournament,
            renter,
            renterReward
        );

        success = true;
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IRentingHookMechanics).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
