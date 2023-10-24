// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IQ Protocol Integration Contracts and their keys.
 */
library IntegrationContracts {
    /**** Integrations ****/
    bytes4 public constant INTEGRATION_FEATURE_REGISTRY = bytes4(keccak256("IntegrationFeatureRegistry"));
}