// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title Different role definitions used by the ACL inside Feature Toggless smart contracts.
 */
library IntegrationRoles {
    // bytes32 public constant ADMIN = 0x00;
    bytes32 public constant INTEGRATION_FEATURES_ADMIN = keccak256("INTEGRATION_FEATURES_ADMIN_ROLE");
}
