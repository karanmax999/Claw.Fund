// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AgentTreasury
 * @notice Central vault for CLAW.FUND.
 *         Holds native MON and ERC-20 tokens.
 *         Only the whitelisted agent can execute trades.
 *         Only governance can update risk parameters or pause.
 */
contract AgentTreasury is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ──────────────────────────── State ────────────────────────────

    address public agent;
    address public governance;

    /// @notice Max basis-points (100 = 1%) a single asset can represent.
    uint256 public maxAllocationBps;

    /// @notice Tracks the total treasury value (set by agent off-chain oracle).
    uint256 public totalTreasuryValue;

    /// @notice Per-token cumulative allocation tracked for risk checks.
    mapping(address => uint256) public tokenAllocation;

    /// @notice Tokens that governance has whitelisted for trading.
    mapping(address => bool) public allowedTokens;

    // ──────────────────────────── Events ───────────────────────────

    event TradeExecuted(
        address indexed token,
        uint256 amount,
        bool isBuy,
        uint256 timestamp
    );

    event RiskUpdated(uint256 newMaxAllocationBps, uint256 timestamp);
    event TokenAllowedStatusChanged(address indexed token, bool allowed);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event GovernanceUpdated(address indexed oldGov, address indexed newGov);
    event TreasuryValueUpdated(uint256 newValue, uint256 timestamp);
    event NativeReceived(address indexed sender, uint256 amount);
    event NativeWithdrawnForTrade(address indexed to, uint256 amount);

    // ──────────────────────────── Modifiers ────────────────────────

    modifier onlyAgent() {
        require(msg.sender == agent, "Treasury: caller is not agent");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "Treasury: caller is not governance");
        _;
    }

    // ──────────────────────────── Constructor ──────────────────────

    /**
     * @param _agent         Address of the off-chain AI agent wallet.
     * @param _governance    Address of the Governance contract (or multisig).
     * @param _maxAllocBps   Initial max allocation per asset in basis points (e.g. 2000 = 20%).
     */
    constructor(
        address _agent,
        address _governance,
        uint256 _maxAllocBps
    ) {
        require(_agent != address(0), "Treasury: zero agent");
        require(_governance != address(0), "Treasury: zero governance");
        require(_maxAllocBps <= 10000, "Treasury: bps > 100%");

        agent = _agent;
        governance = _governance;
        maxAllocationBps = _maxAllocBps;
    }

    // ──────────────────────────── Receive ──────────────────────────

    receive() external payable {
        emit NativeReceived(msg.sender, msg.value);
    }

    // ──────────────────────── Agent Functions ──────────────────────

    /**
     * @notice Execute a trade (buy or sell) for a given ERC-20 token.
     *         On a BUY the treasury sends native MON out (to a DEX router).
     *         On a SELL the treasury sends ERC-20 tokens out.
     *         Actual swap routing happens off-chain; this function is the
     *         custody gate that enforces limits and emits transparency logs.
     * @param token   ERC-20 address being traded.
     * @param amount  Amount in token-units (sell) or native wei (buy).
     * @param isBuy   True = buying token with native, False = selling token for native.
     */
    function executeTrade(
        address token,
        uint256 amount,
        bool isBuy
    ) external onlyAgent whenNotPaused nonReentrant {
        require(allowedTokens[token], "Treasury: token not allowed");
        require(amount > 0, "Treasury: zero amount");

        if (isBuy) {
            // Send native MON to agent for DEX swap
            require(address(this).balance >= amount, "Treasury: insufficient native balance");
            (bool sent, ) = agent.call{value: amount}("");
            require(sent, "Treasury: native transfer failed");
            tokenAllocation[token] += amount;
            emit NativeWithdrawnForTrade(agent, amount);
        } else {
            // Send ERC-20 tokens to agent for DEX swap
            uint256 bal = IERC20(token).balanceOf(address(this));
            require(bal >= amount, "Treasury: insufficient token balance");
            IERC20(token).safeTransfer(agent, amount);
            if (tokenAllocation[token] >= amount) {
                tokenAllocation[token] -= amount;
            } else {
                tokenAllocation[token] = 0;
            }
        }

        // Risk check: allocation must stay within limit
        if (totalTreasuryValue > 0) {
            uint256 allocPct = (tokenAllocation[token] * 10000) / totalTreasuryValue;
            require(allocPct <= maxAllocationBps, "Treasury: allocation exceeds limit");
        }

        emit TradeExecuted(token, amount, isBuy, block.timestamp);
    }

    /**
     * @notice Agent reports the latest total treasury valuation (from off-chain oracle).
     */
    function updateTreasuryValue(uint256 _value) external onlyAgent {
        totalTreasuryValue = _value;
        emit TreasuryValueUpdated(_value, block.timestamp);
    }

    // ────────────────────── Governance Functions ───────────────────

    function updateMaxAllocation(uint256 _newBps) external onlyGovernance {
        require(_newBps <= 10000, "Treasury: bps > 100%");
        maxAllocationBps = _newBps;
        emit RiskUpdated(_newBps, block.timestamp);
    }

    function setTokenAllowed(address _token, bool _allowed) external onlyGovernance {
        allowedTokens[_token] = _allowed;
        emit TokenAllowedStatusChanged(_token, _allowed);
    }

    function updateAgent(address _newAgent) external onlyGovernance {
        require(_newAgent != address(0), "Treasury: zero agent");
        emit AgentUpdated(agent, _newAgent);
        agent = _newAgent;
    }

    function updateGovernance(address _newGov) external onlyGovernance {
        require(_newGov != address(0), "Treasury: zero governance");
        emit GovernanceUpdated(governance, _newGov);
        governance = _newGov;
    }

    function pause() external onlyGovernance {
        _pause();
    }

    function unpause() external onlyGovernance {
        _unpause();
    }

    // ──────────────────────────── Views ────────────────────────────

    function nativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function tokenBalance(address _token) external view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }
}
