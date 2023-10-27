// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../IFeatureController.sol";

interface IRentalDuration is IFeatureController {

  /**
   * @notice Adds a new zero balance address for a given integration.
   * @param integrationAddress The integration address for which the zero balance address needs to be added.
   * @param minDuration The NFT collection addresses for which the zero balance feature needs to be enabled.
   * @param maxDuration The NFT collection addresses for which the zero balance feature needs to be enabled.
   */
  function setRentalDurations(address integrationAddress, uint32 minDuration, uint32 maxDuration) external;

  /**
  * @notice Returns the niminal rental duration for specific Integration.
  * @param integrationAddress The address of Integration.
  * @return minDuration Minimal integration time in seconds.
  */
  function getMinRentalDuration(address integrationAddress) view external returns(uint32 minDuration);

  /**
  * @notice Returns the maximal rental duration for specific Integration.
  * @param integrationAddress The address of Integration.
  * @return maxDuration Maximal integration time in seconds.
  */
  function getMaxRentalDuration(address integrationAddress) view external returns(uint32 maxDuration);


}