// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Interaface for Feature Controllers Contracts.
 * @notice WIP: under development.
 */
interface IFeatureController {

    struct ExecutionObject {
        uint256 rentalId;
        // Rentings.Agreement rentalAgreement;
        // Accounts.RentalEarnings rentalEarnings;
    }

    struct CheckObject {
        address renter;
        uint256 tokenId;
        uint256 amount;
    }

    // something that is called within on rent
    function execute(address renter, address integrationAddress) external view returns (bool isRentable, string memory errorMessage);

    // it is something that is called within is rentable asset
    function check(address renter, address integrationAddress) external view returns (bool isRentable, string memory errorMessage);
}
