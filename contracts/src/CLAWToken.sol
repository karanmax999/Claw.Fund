// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title CLAWToken
 * @notice ERC20 token for the CLAW.FUND ecosystem.
 *         Fixed supply minted entirely to deployer at construction.
 */
contract CLAWToken is ERC20, ERC20Burnable, ERC20Permit {

    uint8 private constant _DECIMALS = 18;

    /**
     * @param initialSupply Total token supply (in whole tokens, scaled by 10**18 internally).
     */
    constructor(uint256 initialSupply)
        ERC20("CLAW", "CLAW")
        ERC20Permit("CLAW")
    {
        require(initialSupply > 0, "CLAWToken: zero supply");
        _mint(msg.sender, initialSupply * 10 ** _DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }
}
