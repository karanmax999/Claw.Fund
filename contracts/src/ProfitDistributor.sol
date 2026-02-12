// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ProfitDistributor
 * @notice Distributes treasury profits to $CLAW holders.
 *         The agent periodically syncs the current treasury value.
 *         When profit exceeds the threshold, a distribution is triggered.
 */
contract ProfitDistributor is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ──────────────────────────── State ────────────────────────────

    IERC20 public clawToken;
    address public agent;
    address public governance;
    address public treasury;

    uint256 public lastSnapshotValue;
    /// @notice Minimum profit (in native wei) before distribution triggers.
    uint256 public profitThreshold;
    /// @notice Percentage of profit to distribute (basis points, e.g. 5000 = 50%).
    uint256 public distributionBps;

    /// @notice Accumulated distributable native balance held by this contract.
    uint256 public pendingDistribution;

    // ──────────────────────────── Events ───────────────────────────

    event TreasuryValueSynced(
        uint256 previousValue,
        uint256 currentValue,
        uint256 profit,
        uint256 timestamp
    );

    event ProfitDistributed(
        uint256 totalAmount,
        uint256 timestamp
    );

    event RewardClaimed(
        address indexed holder,
        uint256 amount,
        uint256 timestamp
    );

    event ProfitThresholdUpdated(uint256 newThreshold);
    event DistributionBpsUpdated(uint256 newBps);
    event AgentUpdated(address indexed newAgent);
    event GovernanceUpdated(address indexed newGovernance);

    // ──────────────────────────── Modifiers ────────────────────────

    modifier onlyAgent() {
        require(msg.sender == agent, "ProfitDist: caller is not agent");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "ProfitDist: caller is not governance");
        _;
    }

    // ──────────────────────────── Constructor ──────────────────────

    /**
     * @param _clawToken        $CLAW token address.
     * @param _agent            Agent wallet address.
     * @param _governance       Governance contract or multisig.
     * @param _treasury         AgentTreasury contract address.
     * @param _profitThreshold  Minimum profit in native wei to trigger distribution.
     * @param _distributionBps  Percentage of profit to distribute (basis points).
     */
    constructor(
        address _clawToken,
        address _agent,
        address _governance,
        address _treasury,
        uint256 _profitThreshold,
        uint256 _distributionBps
    ) {
        require(_clawToken != address(0), "ProfitDist: zero token");
        require(_agent != address(0), "ProfitDist: zero agent");
        require(_governance != address(0), "ProfitDist: zero governance");
        require(_treasury != address(0), "ProfitDist: zero treasury");
        require(_distributionBps <= 10000, "ProfitDist: bps > 100%");

        clawToken = IERC20(_clawToken);
        agent = _agent;
        governance = _governance;
        treasury = _treasury;
        profitThreshold = _profitThreshold;
        distributionBps = _distributionBps;
    }

    // ──────────────────────────── Receive ──────────────────────────

    /// @notice Treasury sends native MON here for distribution.
    receive() external payable {}

    // ──────────────────────── Agent Functions ──────────────────────

    /**
     * @notice Agent reports the latest treasury value.
     *         If profit exceeds threshold, funds become distributable.
     * @param currentValue Current total treasury value in native wei.
     */
    function syncTreasuryValue(uint256 currentValue)
        external
        onlyAgent
        whenNotPaused
    {
        uint256 prev = lastSnapshotValue;

        if (currentValue > prev) {
            uint256 profit = currentValue - prev;

            emit TreasuryValueSynced(prev, currentValue, profit, block.timestamp);

            if (profit >= profitThreshold) {
                uint256 distributable = (profit * distributionBps) / 10000;
                pendingDistribution += distributable;
                lastSnapshotValue = currentValue;

                emit ProfitDistributed(distributable, block.timestamp);
            }
        } else {
            emit TreasuryValueSynced(prev, currentValue, 0, block.timestamp);
            lastSnapshotValue = currentValue;
        }
    }

    /**
     * @notice Distribute pending rewards proportionally to a batch of holders.
     *         Called by agent with an off-chain computed list.
     * @param holders     Array of holder addresses.
     * @param amounts     Corresponding native wei amounts for each holder.
     */
    function distributeTo(
        address[] calldata holders,
        uint256[] calldata amounts
    ) external onlyAgent whenNotPaused nonReentrant {
        require(holders.length == amounts.length, "ProfitDist: length mismatch");
        require(holders.length > 0, "ProfitDist: empty arrays");

        uint256 total;
        for (uint256 i; i < amounts.length; i++) {
            total += amounts[i];
        }
        require(total <= address(this).balance, "ProfitDist: insufficient balance");

        for (uint256 i; i < holders.length; i++) {
            if (amounts[i] > 0) {
                (bool sent, ) = holders[i].call{value: amounts[i]}("");
                require(sent, "ProfitDist: transfer failed");
                emit RewardClaimed(holders[i], amounts[i], block.timestamp);
            }
        }

        if (pendingDistribution >= total) {
            pendingDistribution -= total;
        } else {
            pendingDistribution = 0;
        }
    }

    // ────────────────────── Governance Functions ───────────────────

    function updateProfitThreshold(uint256 _newThreshold) external onlyGovernance {
        profitThreshold = _newThreshold;
        emit ProfitThresholdUpdated(_newThreshold);
    }

    function updateDistributionBps(uint256 _newBps) external onlyGovernance {
        require(_newBps <= 10000, "ProfitDist: bps > 100%");
        distributionBps = _newBps;
        emit DistributionBpsUpdated(_newBps);
    }

    function updateAgent(address _newAgent) external onlyGovernance {
        require(_newAgent != address(0), "ProfitDist: zero agent");
        agent = _newAgent;
        emit AgentUpdated(_newAgent);
    }

    function updateGovernance(address _newGov) external onlyGovernance {
        require(_newGov != address(0), "ProfitDist: zero governance");
        governance = _newGov;
        emit GovernanceUpdated(_newGov);
    }

    function pause() external onlyGovernance {
        _pause();
    }

    function unpause() external onlyGovernance {
        _unpause();
    }

    // ──────────────────────────── Views ────────────────────────────

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
