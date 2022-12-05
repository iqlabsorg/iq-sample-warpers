// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "../interfaces/IContractRegistry.sol";

contract ContractRegistryMock is IContractRegistry {
    /**
     * @dev Contract registry (contract key -> contract address).
     */
    mapping(bytes4 => address) internal _contractRegistry;

    /**
     * @inheritdoc IContractRegistry
     */
    function registerContract(bytes4 contractKey, address contractAddress) external {
        _contractRegistry[contractKey] = contractAddress;
    }

    /**
     * @inheritdoc IContractRegistry
     */
    function getContract(bytes4 contractKey) external view returns (address) {
        return _contractRegistry[contractKey];
    }
}
