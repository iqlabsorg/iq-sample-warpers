// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/renting-hook/IRentingHookMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/availability-period/IAvailabilityPeriodMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/rental-period/IRentalPeriodMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/mechanics/v1-controller/asset-rentability/IAssetRentabilityMechanics.sol";
import "@iqprotocol/iq-space-protocol/contracts/warper/ERC721/IERC721Warper.sol";

import "../../the-red-village/IERC20RewardWarperForTRV.sol";
import "../../external-reward/IExternalRewardWarper.sol";
import "../../zero-balance/IZeroBalanceWarper.sol";
import "../../standard-warper/IStandardWarper.sol";
import "../../minimum-threshold/IMinimumThresholdWarper.sol";
import "../../minimum-threshold-v2/IMinimumThresholdWarperV2.sol";
import "../../iq-pixelsteins/IIQPixelsteinsArsenalWarper.sol";
import "../../max-duration-raffle/MaxDurationRaffleWarper.sol";

import "../../feature-toggles/features/minimum-threshold/IMinimumThreshold.sol";
import "../../feature-toggles/features/zero-balance/IZeroBalance.sol";


contract SolidityInterfaces {
    struct Interface {
        string name;
        bytes4 id;
    }

    Interface[] internal _list;

    constructor() {
        _list.push(Interface("IERC721", type(IERC721).interfaceId));
        _list.push(Interface("IERC165", type(IERC165).interfaceId));

        _list.push(Interface("IExternalRewardWarper", type(IExternalRewardWarper).interfaceId));
        _list.push(Interface("IERC20RewardWarperForTRV", type(IERC20RewardWarperForTRV).interfaceId));
        _list.push(Interface("IExternalRewardWarper", type(IExternalRewardWarper).interfaceId));
        _list.push(Interface("IZeroBalanceWarper", type(IZeroBalanceWarper).interfaceId));
        _list.push(Interface("IMinimumThresholdWarper", type(IMinimumThresholdWarper).interfaceId));
        _list.push(Interface("IIQPixelsteinsArsenalWarper", type(IIQPixelsteinsArsenalWarper).interfaceId));
        _list.push(Interface("IMaxDurationRaffleWarper", type(IMaxDurationRaffleWarper).interfaceId));
        _list.push(Interface("IStandardWarper", type(IStandardWarper).interfaceId));
        _list.push(Interface("IMinimumThresholdWarperV2", type(IMinimumThresholdWarperV2).interfaceId));

        _list.push(Interface("IAvailabilityPeriodMechanics", type(IAvailabilityPeriodMechanics).interfaceId));
        _list.push(Interface("IRentalPeriodMechanics", type(IRentalPeriodMechanics).interfaceId));
        _list.push(Interface("IRentingHookMechanics", type(IRentingHookMechanics).interfaceId));
        _list.push(Interface("IAssetRentabilityMechanics", type(IAssetRentabilityMechanics).interfaceId));
        _list.push(Interface("IWarper", type(IWarper).interfaceId));
        _list.push(Interface("IERC721Warper", type(IERC721Warper).interfaceId));

        _list.push(Interface("IZeroBalance", type(IZeroBalance).interfaceId));
        _list.push(Interface("IMinimumThreshold", type(IMinimumThreshold).interfaceId));
    }

    function list() external view returns (Interface[] memory) {
        return _list;
    }
}
