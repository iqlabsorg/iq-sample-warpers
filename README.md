# IQ NFT Collection

## Deployment

1. Create a `.env` file in the project root directory, looking at the `.env.example` file for guidance.
2. Modify the `networks` section inside `hardhat.config.ts` to add your desired network.

```shell
# View docs of the warper deployment
yarn hardhat deploy:erc20-reward-warper --help

# Deploy the NFT Warper
yarn hardhat --network [networkName] deploy:deploy:erc20-reward-warper --original 0x0000000000000000000000000000000000000000 --metahub 0x0000000000000000000000000000000000000000 --protocol-allocation	100 --reward-pool 0x0000000000000000000000000000000000000000 --universe-allocation	100 --universe-treasury	0x0000000000000000000000000000000000000000
```

## Potential integration

Source code for the tournament: https://polygonscan.com/address/0x23C151747f937f39aEa022Df20B17f4AA43A8C42#code

```solidity
  // This variables gets set somewhere in the contract, possibly the constructor.
  ERC20RewardWarper public warper;

  struct Warrior {
    address account;
    uint32 win_position;
    uint256 ID;
    uint16 stance;
    bytes data;
  }

  function joinTournament(bytes memory, bytes memory _params) external virtual override onlyRoler("joinTournament") {
    address signer = tx.origin;
    // NOTE: I have introduced an extra decode parameter - `origin` which would represent the address of the warrior's origin (warper or the original).
    (uint64 _serviceID, uint64 tournamentID, address joiner, uint256 championID, uint16 stance, address origin) = abi.decode(_params, (uint64, uint64, address, uint256, uint16, address));

    ...

    // IMPORTANT! Call the onJoinTournament hook on the warper!.
    if (origin == address(warper)) warper.onJoinTournament(tournamentID, joiner, championID);

    ...
  }

  function _isRentedWarrior(TournamentTypes.Warrior memory warrior) internal returns (bool) {
    // Exercise for the reader.
    // NOTE: Possible solutions for this would be to introduce an additional mapping
    //       or encode the data inside the warrior.data field. The end goal is to
    //       associate the address of warriors origin -- either the original or the
    //       warped one.
    // example: `return warrior.getOrigin() == address(warper)`
    ...
  }

  function completeTournament(
    uint64 _tournamentID,
    TournamentTypes.Warrior[] memory _warriors,
    TournamentTypes.EloDto[] memory,
    bytes memory
  ) external virtual override onlyRoler("completeTournament") {
    ...
    for (uint256 i = 0; i < _warriors.length; i++) {
      require(_warriors[i].win_position > 0, "Invalid position");
      if (_warriors[i].win_position == 1) {
        if(_isRentedWarrior(_warriors[i].address = address(warper)) {
          // NOTE: We are assuming that the `warper.getRewardPool()` is the same as `address(this)`
          IERC20(tournament.configs.currency).approve(address(warper), winnings);

          warper.disperseRewards(_tournamentID, _warriors[i].ID, winnings, _warriors[i].account, tournament.configs.currency);
        } else {
          IERC20(tournament.configs.currency).transfer(_warriors[i].account, winnings);
        }
        winner = _warriors[i].account;
      }
    ...
    }
  }
```
