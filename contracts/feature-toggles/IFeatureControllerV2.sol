// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@iqprotocol/iq-space-protocol/contracts/renting/Rentings.sol";
import "@iqprotocol/iq-space-protocol/contracts/accounting/Accounts.sol";

/**
 * @title Interaface for Feature Controllers Contracts.
 * @notice WIP: under development.
 */
interface IFeatureControllerV2 {
    struct ExecutionObject {
        uint256 rentalId;
        Rentings.Agreement rentalAgreement;
        Accounts.RentalEarnings rentalEarnings;
    }

    struct CheckObject {
        address renter;
        uint256 tokenId;
        uint256 amount;
    }

    function execute(address integrationAddress, ExecutionObject calldata executionObject) external returns (bool success, string memory errorMessage);

    function check(address integrationAddress, CheckObject calldata checkObject) external view returns (bool isRentable, string memory errorMessage);
}
