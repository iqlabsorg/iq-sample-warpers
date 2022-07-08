// SPDX-License-Identifier: MIT
// solhint-disable private-vars-leading-underscore
pragma solidity 0.8.15;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../ERC20RewardWarper.sol";

/// @dev Mock of The Red Village Tournament contract.
/// Purposes:
/// 1. Showcase of interoperability.
/// 2. Example of interface.
/// 3. Tests.
contract MockTRVTournament is Ownable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct Warrior {
        // Adding participant address simplifies the process of mapping
        // on the Warper level for registering on tournament and for
        // reward mechanism
        address participant;
        address collectionAddress;
        uint256 warriorId;
        uint16 style;
    }

    struct Tournament {
        uint256 prizePool;
        Warrior[] warriors;
        mapping(uint256 => uint256) warriorIdsIndex;
    }

    uint256 internal _tournamentParticipationFee = 1000;

    address internal _rewardTokenAddress;

    mapping(address => bool) internal _enabledWarpers;

    mapping(uint256 => Tournament) internal _tournaments;

    CountersUpgradeable.Counter internal _tournamentIds;

    constructor(address rewardTokenAddress) {
        _rewardTokenAddress = rewardTokenAddress;
    }

    function setWarperStatus(address warper, bool status) external onlyOwner {
        _enabledWarpers[warper] = status;
    }

    function createTournament() external returns (uint256) {
        _tournamentIds.increment();
        return _tournamentIds.current();
    }

    function joinTournament(
        uint256 tournamentId,
        // required for differentiating between original NFTs and warper
        address collectionAddress,
        uint256 warriorId,
        uint16 style
    ) external {
        uint256 amount = _tournamentParticipationFee;
        address participant = msg.sender;

        // ERC721 Warper implements IERC721 interface, that's why even we're
        // trying to call original collection or warped collection using IERC721
        // interface we would get a proper result.
        require(IERC721(collectionAddress).ownerOf(warriorId) == participant);

        IERC20Upgradeable(_rewardTokenAddress).transferFrom(
            participant,
            address(this),
            amount
        );

        _tournaments[tournamentId].warriors.push(
            Warrior({
                participant: participant,
                collectionAddress: collectionAddress,
                warriorId: warriorId,
                style: style
            })
        );
        _tournaments[tournamentId].warriorIdsIndex[warriorId] =
            _tournaments[tournamentId].warriors.length -
            1;
        _tournaments[tournamentId].prizePool += amount;

        // Warpers and their workflow should be controller on The Red Village side
        // using setWarperStatus() method, that could be called only by the owner.
        bool isWarpedAsset = _enabledWarpers[collectionAddress];

        if (isWarpedAsset) {
            // Calling __onJoinedTournament hook only in case we're communicating with the warper.
            (bool success, string memory errorMessage) = ERC20RewardWarper(
                payable(collectionAddress)
            ).__onJoinedTournament(tournamentId, participant, warriorId);
        }
    }

    function setWinner(
        uint256 tournamentId,
        uint256 firstWinner,
        uint256 secondWinner
    ) external {
        Tournament storage tournament = _tournaments[tournamentId];

        // first winner data
        uint256 firstWinnerIndex = tournament.warriorIdsIndex[firstWinner];
        address firstWinnerAddress = tournament
            .warriors[firstWinnerIndex]
            .participant;
        address firstWinnerCollectionAddress = tournament
            .warriors[firstWinnerIndex]
            .collectionAddress;
        uint256 firstWinnerReward = (tournament.prizePool * 700) / 1000;

        // second winner data
        uint256 secondWinnerIndex = tournament.warriorIdsIndex[secondWinner];
        address secondWinnerAddress = tournament
            .warriors[secondWinnerIndex]
            .participant;
        address secondWinnerCollectionAddress = tournament
            .warriors[firstWinnerIndex]
            .collectionAddress;
        uint256 secondWinnerReward = (tournament.prizePool * 300) / 1000;

        // NOTE calling __onDistribution() hook on the warper if address of collection is warper
        // distribution for the first winner
        if (_enabledWarpers[firstWinnerCollectionAddress]) {
            IERC20(_rewardTokenAddress).approve(
                firstWinnerCollectionAddress,
                firstWinnerReward
            );
            (bool success, ) = ERC20RewardWarper(
                payable(firstWinnerCollectionAddress)
            ).__onDistribution(
                    tournamentId,
                    firstWinnerAddress,
                    firstWinnerReward,
                    _rewardTokenAddress
                );
        }

        // distribution for the second winner
        if (_enabledWarpers[secondWinnerCollectionAddress]) {
            IERC20(_rewardTokenAddress).approve(
                secondWinnerCollectionAddress,
                secondWinnerReward
            );
            (bool success, ) = ERC20RewardWarper(
                payable(secondWinnerCollectionAddress)
            ).__onDistribution(
                    tournamentId,
                    secondWinnerAddress,
                    secondWinnerReward,
                    _rewardTokenAddress
                );
        }
    }
}
