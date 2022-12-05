// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface IContractRegistry {
    /**
     * @dev Thrown when the contract with a provided key does not exist.
     */
    error InvalidContractEntityInterface();

    /**
     * @dev Thrown when the contract with a provided key does not exist.
     */
    error ContractKeyMismatch(bytes4 keyProvided, bytes4 keyRequired);

    /**
     * @dev Thrown when the contract with a provided key does not exist.
     */
    error ContractNotAuthorized(bytes4 keyProvided, address addressProvided);

    /**
     * @dev Thrown when the contract with a provided key does not exist.
     */
    error ContractDoesNotExist(bytes4 keyProvided);

    /**
     * @dev Emitted when the new contract is registered.
     * @param contractKey Key of the contract.
     * @param contractAddress Address of the contract.
     */
    event ContractRegistered(bytes4 contractKey, address contractAddress);

    /**
     * @dev Register new contract with a key.
     * @param contractKey Key of the contract.
     * @param contractAddress Address of the contract.
     */
    function registerContract(bytes4 contractKey, address contractAddress) external;

    /**
     * @dev Get contract address with a key.
     * @param contractKey Key of the contract.
     * @return Contract address.
     */
    function getContract(bytes4 contractKey) external view returns (address);
}
