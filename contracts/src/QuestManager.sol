// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title QuestManager
 * @notice Minimal V1 quest system for CLAW.FUND.
 *         Agent creates quests; users complete them and claim rewards.
 */
contract QuestManager is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ──────────────────────────── Types ────────────────────────────

    enum QuestType {
        HoldTokens,      // Must hold >= threshold $CLAW
        ProvideLiquidity, // Must have LP tokens (verified off-chain, agent attests)
        ParticipateVote   // Must have voted in governance (verified off-chain)
    }

    struct Quest {
        uint256 id;
        string description;
        uint256 reward;        // in native wei
        bool active;
        QuestType questType;
        uint256 threshold;     // e.g. min $CLAW for HoldTokens quest
    }

    // ──────────────────────────── State ────────────────────────────

    IERC20 public clawToken;
    address public agent;
    address public governance;

    uint256 public questCount;
    mapping(uint256 => Quest) public quests;
    /// @notice questId => user => completed
    mapping(uint256 => mapping(address => bool)) public questCompleted;

    // ──────────────────────────── Events ───────────────────────────

    event QuestCreated(
        uint256 indexed questId,
        string description,
        uint256 reward,
        QuestType questType,
        uint256 threshold
    );

    event QuestCompleted(
        address indexed user,
        uint256 indexed questId,
        uint256 reward,
        uint256 timestamp
    );

    event QuestDeactivated(uint256 indexed questId);
    event AgentUpdated(address indexed newAgent);
    event GovernanceUpdated(address indexed newGovernance);

    // ──────────────────────────── Modifiers ────────────────────────

    modifier onlyAgent() {
        require(msg.sender == agent, "QuestMgr: caller is not agent");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "QuestMgr: caller is not governance");
        _;
    }

    // ──────────────────────────── Constructor ──────────────────────

    /**
     * @param _clawToken   $CLAW token address.
     * @param _agent       Agent wallet address.
     * @param _governance  Governance contract or multisig.
     */
    constructor(
        address _clawToken,
        address _agent,
        address _governance
    ) {
        require(_clawToken != address(0), "QuestMgr: zero token");
        require(_agent != address(0), "QuestMgr: zero agent");
        require(_governance != address(0), "QuestMgr: zero governance");

        clawToken = IERC20(_clawToken);
        agent = _agent;
        governance = _governance;
    }

    // ──────────────────────────── Receive ──────────────────────────

    /// @notice Receives native MON to fund quest rewards.
    receive() external payable {}

    // ──────────────────────── Agent Functions ──────────────────────

    /**
     * @notice Create a new quest.
     * @param _description  Human-readable description.
     * @param _reward       Reward in native wei.
     * @param _questType    Type of verification.
     * @param _threshold    Relevant threshold (e.g. min CLAW for HoldTokens).
     */
    function createQuest(
        string calldata _description,
        uint256 _reward,
        QuestType _questType,
        uint256 _threshold
    ) external onlyAgent returns (uint256) {
        questCount++;
        uint256 qid = questCount;

        quests[qid] = Quest({
            id: qid,
            description: _description,
            reward: _reward,
            active: true,
            questType: _questType,
            threshold: _threshold
        });

        emit QuestCreated(qid, _description, _reward, _questType, _threshold);
        return qid;
    }

    function deactivateQuest(uint256 _questId) external onlyAgent {
        require(quests[_questId].id != 0, "QuestMgr: quest does not exist");
        quests[_questId].active = false;
        emit QuestDeactivated(_questId);
    }

    // ────────────────────── Verification & Claim ──────────────────

    /**
     * @notice User verifies and claims a quest reward.
     *         For HoldTokens: on-chain check of $CLAW balance.
     *         For other types: agent must pre-attest via attestQuest().
     * @param _questId Quest ID to verify and claim.
     */
    function verifyAndClaimQuest(uint256 _questId)
        external
        whenNotPaused
        nonReentrant
    {
        Quest storage q = quests[_questId];
        require(q.id != 0, "QuestMgr: quest does not exist");
        require(q.active, "QuestMgr: quest not active");
        require(!questCompleted[_questId][msg.sender], "QuestMgr: already completed");

        // On-chain verification for HoldTokens
        if (q.questType == QuestType.HoldTokens) {
            require(
                clawToken.balanceOf(msg.sender) >= q.threshold,
                "QuestMgr: insufficient CLAW balance"
            );
        } else {
            // For LP and Vote quests, agent must have pre-attested
            require(
                _attestations[_questId][msg.sender],
                "QuestMgr: not attested by agent"
            );
        }

        questCompleted[_questId][msg.sender] = true;

        // Pay reward in native MON
        if (q.reward > 0) {
            require(address(this).balance >= q.reward, "QuestMgr: insufficient reward funds");
            (bool sent, ) = msg.sender.call{value: q.reward}("");
            require(sent, "QuestMgr: reward transfer failed");
        }

        emit QuestCompleted(msg.sender, _questId, q.reward, block.timestamp);
    }

    // ──────────────────── Agent Attestation ───────────────────────

    /// @notice Agent attests that a user has met off-chain quest criteria.
    mapping(uint256 => mapping(address => bool)) private _attestations;

    function attestQuest(uint256 _questId, address _user) external onlyAgent {
        require(quests[_questId].id != 0, "QuestMgr: quest does not exist");
        _attestations[_questId][_user] = true;
    }

    function isAttested(uint256 _questId, address _user) external view returns (bool) {
        return _attestations[_questId][_user];
    }

    // ────────────────────── Governance Functions ───────────────────

    function updateAgent(address _newAgent) external onlyGovernance {
        require(_newAgent != address(0), "QuestMgr: zero agent");
        agent = _newAgent;
        emit AgentUpdated(_newAgent);
    }

    function updateGovernance(address _newGov) external onlyGovernance {
        require(_newGov != address(0), "QuestMgr: zero governance");
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

    function getQuest(uint256 _questId) external view returns (Quest memory) {
        return quests[_questId];
    }

    function hasCompleted(uint256 _questId, address _user) external view returns (bool) {
        return questCompleted[_questId][_user];
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
