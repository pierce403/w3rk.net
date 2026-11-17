// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title W3rkToken
 * @dev Simple ERC20 token for the w3rk.net platform
 * 100 million tokens distributed to deployer
 */
contract W3rkToken is ERC20 {
    constructor() ERC20("W3rk Token", "W3RK") {
        // Mint 100 million tokens (100,000,000 * 10^18 for 18 decimals)
        _mint(msg.sender, 100_000_000 * 10**decimals());
    }
}
