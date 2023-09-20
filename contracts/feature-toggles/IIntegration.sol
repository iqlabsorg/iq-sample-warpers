// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../external-reward/IExternalRewardWarper.sol";

interface IIntegration is IExternalRewardWarper {

    function getFeatureControllerAddress(uint256 featureId) external view returns (address);

}
