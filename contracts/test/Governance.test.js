const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("Governance", function () {
  let token, governance, treasury;
  let deployer, agent, govAdmin, voter1, voter2, attacker;

  const INITIAL_SUPPLY = 1_000_000n;
  const VOTING_PERIOD = 100; // 100 blocks
  const MIN_PROPOSAL_TOKENS = ethers.parseEther("100");

  beforeEach(async function () {
    [deployer, agent, govAdmin, voter1, voter2, attacker] = await ethers.getSigners();

    // Deploy CLAW token
    const CLAWToken = await ethers.getContractFactory("CLAWToken");
    token = await CLAWToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();

    // Deploy Treasury (used as admin for governance)
    const AgentTreasury = await ethers.getContractFactory("AgentTreasury");
    treasury = await AgentTreasury.deploy(agent.address, govAdmin.address, 2000);
    await treasury.waitForDeployment();

    // Deploy Governance
    const Governance = await ethers.getContractFactory("Governance");
    governance = await Governance.deploy(
      await token.getAddress(),
      await treasury.getAddress(),
      VOTING_PERIOD,
      MIN_PROPOSAL_TOKENS
    );
    await governance.waitForDeployment();

    // Distribute tokens to voters
    await token.transfer(voter1.address, ethers.parseEther("10000"));
    await token.transfer(voter2.address, ethers.parseEther("5000"));
  });

  describe("Deployment", function () {
    it("should set clawToken, treasury, votingPeriod, minProposalTokens", async function () {
      expect(await governance.clawToken()).to.equal(await token.getAddress());
      expect(await governance.treasury()).to.equal(await treasury.getAddress());
      expect(await governance.votingPeriod()).to.equal(VOTING_PERIOD);
      expect(await governance.minProposalTokens()).to.equal(MIN_PROPOSAL_TOKENS);
    });

    it("should reject zero token address", async function () {
      const Governance = await ethers.getContractFactory("Governance");
      await expect(
        Governance.deploy(ethers.ZeroAddress, await treasury.getAddress(), VOTING_PERIOD, MIN_PROPOSAL_TOKENS)
      ).to.be.revertedWith("Governance: zero token");
    });

    it("should reject zero voting period", async function () {
      const Governance = await ethers.getContractFactory("Governance");
      await expect(
        Governance.deploy(await token.getAddress(), await treasury.getAddress(), 0, MIN_PROPOSAL_TOKENS)
      ).to.be.revertedWith("Governance: zero voting period");
    });
  });

  describe("Proposals", function () {
    it("should allow token holders to create proposals", async function () {
      const tx = await governance.connect(voter1).createProposal("Increase risk limit to 30%");
      await expect(tx).to.emit(governance, "ProposalCreated");
      expect(await governance.proposalCount()).to.equal(1);

      const p = await governance.getProposal(1);
      expect(p.description).to.equal("Increase risk limit to 30%");
      expect(p.proposer).to.equal(voter1.address);
      expect(p.executed).to.be.false;
    });

    it("should reject proposal from user with insufficient tokens", async function () {
      await expect(
        governance.connect(attacker).createProposal("Malicious proposal")
      ).to.be.revertedWith("Governance: insufficient CLAW to propose");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await governance.connect(voter1).createProposal("Test proposal");
    });

    it("should allow token holders to vote FOR", async function () {
      const tx = await governance.connect(voter1).vote(1, true);
      await expect(tx).to.emit(governance, "VoteCast");

      const p = await governance.getProposal(1);
      expect(p.forVotes).to.equal(ethers.parseEther("10000"));
    });

    it("should allow token holders to vote AGAINST", async function () {
      await governance.connect(voter2).vote(1, false);
      const p = await governance.getProposal(1);
      expect(p.againstVotes).to.equal(ethers.parseEther("5000"));
    });

    it("should prevent double voting", async function () {
      await governance.connect(voter1).vote(1, true);
      await expect(
        governance.connect(voter1).vote(1, true)
      ).to.be.revertedWith("Governance: already voted");
    });

    it("should prevent voting with zero balance", async function () {
      await expect(
        governance.connect(attacker).vote(1, true)
      ).to.be.revertedWith("Governance: no voting power");
    });

    it("should prevent voting after period ends", async function () {
      await mine(VOTING_PERIOD + 1);
      await expect(
        governance.connect(voter1).vote(1, true)
      ).to.be.revertedWith("Governance: voting ended");
    });

    it("should report voting as active during period", async function () {
      expect(await governance.isVotingActive(1)).to.be.true;
    });

    it("should report voting as inactive after period", async function () {
      await mine(VOTING_PERIOD + 1);
      expect(await governance.isVotingActive(1)).to.be.false;
    });
  });

  describe("Execution", function () {
    beforeEach(async function () {
      await governance.connect(voter1).createProposal("Approved proposal");
      await governance.connect(voter1).vote(1, true);
      await governance.connect(voter2).vote(1, false);
    });

    it("should execute a passed proposal after voting ends", async function () {
      await mine(VOTING_PERIOD + 1);
      const tx = await governance.executeProposal(1);
      await expect(tx).to.emit(governance, "ProposalExecuted").withArgs(1);
    });

    it("should reject execution before voting ends", async function () {
      await expect(
        governance.executeProposal(1)
      ).to.be.revertedWith("Governance: voting not ended");
    });

    it("should reject execution of rejected proposal", async function () {
      // Create proposal where against > for
      await governance.connect(voter1).createProposal("Bad proposal");
      await governance.connect(voter2).vote(2, true); // 5000
      // Transfer more to attacker to vote against
      await token.transfer(attacker.address, ethers.parseEther("10000"));
      await governance.connect(attacker).vote(2, false); // 10000

      await mine(VOTING_PERIOD + 1);
      await expect(
        governance.executeProposal(2)
      ).to.be.revertedWith("Governance: proposal rejected");
    });

    it("should reject double execution", async function () {
      await mine(VOTING_PERIOD + 1);
      await governance.executeProposal(1);
      await expect(
        governance.executeProposal(1)
      ).to.be.revertedWith("Governance: already executed");
    });
  });

  describe("Non-existent Proposals", function () {
    it("should reject voting on non-existent proposal", async function () {
      await expect(
        governance.connect(voter1).vote(999, true)
      ).to.be.revertedWith("Governance: proposal does not exist");
    });

    it("should reject execution of non-existent proposal", async function () {
      await expect(
        governance.executeProposal(999)
      ).to.be.revertedWith("Governance: proposal does not exist");
    });
  });
});
