// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Mock ERC721 TRV NFT collection contract
contract MockTRVCollection is ERC721 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC721(name, symbol) {
        uint256 tokenId = 0;

        for (uint256 i = 0; i < totalSupply; i++) {
            tokenId++;
            _mint(msg.sender, tokenId);
        }

        if (tokenId == 0) revert();
    }
}
