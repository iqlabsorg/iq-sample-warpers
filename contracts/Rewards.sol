// SPDX-License-Identifier: MIT
// solhint-disable private-vars-leading-underscore
pragma solidity ^0.8.15;

import "@iqprotocol/solidity-contracts-nft/contracts/renting/Rentings.sol";

library Rewards {

    function mul(uint256 base, uint256 percentage) internal pure returns (uint256) {
        return (base * percentage) / Rentings.HUNDRED_PERCENT;
    }
}
