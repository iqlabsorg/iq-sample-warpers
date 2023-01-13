// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@iqprotocol/solidity-contracts-nft/contracts/warper/mechanics/v1/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/warper/mechanics/v1/availability-period/IAvailabilityPeriodMechanics.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/warper/mechanics/v1/rental-period/IRentalPeriodMechanics.sol";
import "@iqprotocol/solidity-contracts-nft/contracts/warper/ERC721/IERC721Warper.sol";
import "../../the-red-village/IERC20RewardWarperForTRV.sol";

contract SolidityInterfaces {
    struct Interface {
        string name;
        bytes4 id;
    }

    Interface[] internal _list;

    constructor() {
        _list.push(Interface("IERC721", type(IERC721).interfaceId));
        _list.push(Interface("IERC165", type(IERC165).interfaceId));

        _list.push(Interface("IERC20RewardWarperForTRV", type(IERC20RewardWarperForTRV).interfaceId));

        _list.push(Interface("IAvailabilityPeriodMechanics", type(IAvailabilityPeriodMechanics).interfaceId));
        _list.push(Interface("IRentalPeriodMechanics", type(IRentalPeriodMechanics).interfaceId));
        _list.push(Interface("IRentingHookMechanics", type(IRentingHookMechanics).interfaceId));
        _list.push(Interface("IWarper", type(IWarper).interfaceId));
        _list.push(Interface("IERC721Warper", type(IERC721Warper).interfaceId));
    }

    function list() external view returns (Interface[] memory) {
        return _list;
    }
}
