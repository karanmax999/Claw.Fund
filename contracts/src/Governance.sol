// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Governance
 * @notice Simple token-weighted governance for CLAW.FUND.
 *         $CLAW holders create proposals, vote, and execute strategy changes.
 */
contract Governance is ReentrancyGuard {

    // ──────────────────────────── Types ────────────────────────────

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }

    // ──────────────────────────── State ────────────────────────────

    IERC20 public clawToken;
    address public treasury;

    uint256 public proposalCount;
    uint256 public votingPeriod; // in blocks
    uint256 public minProposalTokens; // minimum $CLAW to create a proposal

    mapping(uint256 => Proposal) public proposals;
    /// @notice proposalId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // ──────────────────────────── Events ───────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);

    event VotingPeriodUpdated(uint256 newPeriod);
    event MinProposalTokensUpdated(uint256 newMin);
    event TreasuryUpdated(address indexed newTreasury);

    // ──────────────────────────── Modifiers ────────────────────────

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Governance: caller is not treasury");
        _;
    }

    // ──────────────────────────── Constructor ──────────────────────

    /**
     * @param _clawToken         Address of the $CLAW ERC-20 token.
     * @param _treasury          Address of the AgentTreasury contract.
     * @param _votingPeriod      Number of blocks a proposal is open for voting.
     * @param _minProposalTokens Minimum $CLAW balance required to create a proposal.
     */
    constructor(
        address _clawToken,
        address _treasury,
        uint256 _votingPeriod,
        uint256 _minProposalTokens
    ) {
        require(_clawToken != address(0), "Governance: zero token");
        require(_treasury != address(0), "Governance: zero treasury");
        require(_votingPeriod > 0, "Governance: zero voting period");

        clawToken = IERC20(_clawToken);
        treasury = _treasury;
        votingPeriod = _votingPeriod;
        minProposalTokens = _minProposalTokens;
    }

    // ──────────────────────── Core Functions ──────────────────────

    /**
     * @notice Create a new governance proposal.
     * @param _description Human-readable description of the proposal.
     */
    function createProposal(string calldata _description) external returns (uint256) {
        require(
            clawToken.balanceOf(msg.sender) >= minProposalTokens,
            "Governance: insufficient CLAW to propose"
        );

        proposalCount++;
        uint256 pid = proposalCount;

        proposals[pid] = Proposal({
            id: pid,
            proposer: msg.sender,
            description: _description,
            startBlock: block.number,
            endBlock: block.number + votingPeriod,
            forVotes: 0,
            againstVotes: 0,
            executed: false
        });

        emit ProposalCreated(pid, msg.sender, _description, block.number, block.number + votingPeriod);
        return pid;
    }

    /**
     * @notice Cast a token-weighted vote on an active proposal.
     * @param _proposalId ID of the proposal.
     * @param _support    True = for, False = against.
     */
    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0, "Governance: proposal does not exist");
        require(block.number <= p.endBlock, "Governance: voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Governance: already voted");

        uint256 weight = clawToken.balanceOf(msg.sender);
        require(weight > 0, "Governance: no voting power");

        hasVoted[_proposalId][msg.sender] = true;

        if (_support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }

    /**
     * @notice Mark a proposal as executed after voting ends and quorum passes.
     *         Actual parameter changes are triggered via the treasury/governance
     *         admin flow — this records the on-chain decision.
     * @param _proposalId ID of the proposal to execute.
     */
    function executeProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0, "Governance: proposal does not exist");
        require(block.number > p.endBlock, "Governance: voting not ended");
        require(!p.executed, "Governance: already executed");
        require(p.forVotes > p.againstVotes, "Governance: proposal rejected");

        p.executed = true;
        emit ProposalExecuted(_proposalId);
    }

    // ──────────────────── Admin (via Treasury) ────────────────────

    function updateVotingPeriod(uint256 _newPeriod) external onlyTreasury {
        require(_newPeriod > 0, "Governance: zero period");
        votingPeriod = _newPeriod;
        emit VotingPeriodUpdated(_newPeriod);
    }

    function updateMinProposalTokens(uint256 _newMin) external onlyTreasury {
        minProposalTokens = _newMin;
        emit MinProposalTokensUpdated(_newMin);
    }

    function updateTreasury(address _newTreasury) external onlyTreasury {
        require(_newTreasury != address(0), "Governance: zero treasury");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    // ──────────────────────────── Views ────────────────────────────

    function getProposal(uint256 _proposalId)
        external
        view
        returns (Proposal memory)
    {
        return proposals[_proposalId];
    }

    function isVotingActive(uint256 _proposalId) external view returns (bool) {
        Proposal storage p = proposals[_proposalId];
        return (p.id != 0 && block.number <= p.endBlock && !p.executed);
    }
}
