const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentTreasury", function () {
  let token, treasury;
  let deployer, agent, governance, attacker, user1;

  const INITIAL_SUPPLY = 1_000_000n;
  const MAX_ALLOC_BPS = 2000n; // 20%

  beforeEach(async function () {
    [deployer, agent, governance, attacker, user1] = await ethers.getSigners();

    // Deploy CLAW token
    const CLAWToken = await ethers.getContractFactory("CLAWToken");
    token = await CLAWToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();

    // Deploy Treasury
    const AgentTreasury = await ethers.getContractFactory("AgentTreasury");
    treasury = await AgentTreasury.deploy(agent.address, governance.address, MAX_ALLOC_BPS);
    await treasury.waitForDeployment();

    // Allow token in treasury
    await treasury.connect(governance).setTokenAllowed(await token.getAddress(), true);

    // Fund treasury with native MON (10 ETH)
    await deployer.sendTransaction({
      to: await treasury.getAddress(),
      value: ethers.parseEther("10"),
    });

    // Transfer some tokens to treasury
    await token.transfer(await treasury.getAddress(), ethers.parseEther("100000"));

    // Set treasury value so allocation checks work
    await treasury.connect(agent).updateTreasuryValue(ethers.parseEther("10"));
  });

  describe("Deployment", function () {
    it("should set agent and governance correctly", async function () {
      expect(await treasury.agent()).to.equal(agent.address);
      expect(await treasury.governance()).to.equal(governance.address);
    });

    it("should set maxAllocationBps", async function () {
      expect(await treasury.maxAllocationBps()).to.equal(MAX_ALLOC_BPS);
    });

    it("should reject zero agent address", async function () {
      const AgentTreasury = await ethers.getContractFactory("AgentTreasury");
      await expect(
        AgentTreasury.deploy(ethers.ZeroAddress, governance.address, MAX_ALLOC_BPS)
      ).to.be.revertedWith("Treasury: zero agent");
    });

    it("should reject zero governance address", async function () {
      const AgentTreasury = await ethers.getContractFactory("AgentTreasury");
      await expect(
        AgentTreasury.deploy(agent.address, ethers.ZeroAddress, MAX_ALLOC_BPS)
      ).to.be.revertedWith("Treasury: zero governance");
    });
  });

  describe("Access Control", function () {
    it("should allow only agent to execute trades", async function () {
      await expect(
        treasury.connect(attacker).executeTrade(await token.getAddress(), ethers.parseEther("0.1"), true)
      ).to.be.revertedWith("Treasury: caller is not agent");
    });

    it("should allow only governance to update max allocation", async function () {
      await expect(
        treasury.connect(attacker).updateMaxAllocation(3000)
      ).to.be.revertedWith("Treasury: caller is not governance");
    });

    it("should allow only governance to pause", async function () {
      await expect(
        treasury.connect(attacker).pause()
      ).to.be.revertedWith("Treasury: caller is not governance");
    });

    it("should allow only governance to unpause", async function () {
      await treasury.connect(governance).pause();
      await expect(
        treasury.connect(attacker).unpause()
      ).to.be.revertedWith("Treasury: caller is not governance");
    });

    it("should allow only governance to set token allowed", async function () {
      await expect(
        treasury.connect(attacker).setTokenAllowed(await token.getAddress(), false)
      ).to.be.revertedWith("Treasury: caller is not governance");
    });

    it("should allow only governance to update agent", async function () {
      await expect(
        treasury.connect(attacker).updateAgent(attacker.address)
      ).to.be.revertedWith("Treasury: caller is not governance");
    });
  });

  describe("Execute Trade", function () {
    it("should execute a buy trade (send native to agent)", async function () {
      const amount = ethers.parseEther("0.1");
      const tx = await treasury.connect(agent).executeTrade(await token.getAddress(), amount, true);
      await expect(tx).to.emit(treasury, "TradeExecuted");
    });

    it("should execute a sell trade (send tokens to agent)", async function () {
      const amount = ethers.parseEther("100");
      const tx = await treasury.connect(agent).executeTrade(await token.getAddress(), amount, false);
      await expect(tx).to.emit(treasury, "TradeExecuted");
    });

    it("should revert trade for disallowed token", async function () {
      const fakeToken = attacker.address;
      await expect(
        treasury.connect(agent).executeTrade(fakeToken, ethers.parseEther("1"), true)
      ).to.be.revertedWith("Treasury: token not allowed");
    });

    it("should revert trade with zero amount", async function () {
      await expect(
        treasury.connect(agent).executeTrade(await token.getAddress(), 0, true)
      ).to.be.revertedWith("Treasury: zero amount");
    });

    it("should revert buy if insufficient native balance", async function () {
      await expect(
        treasury.connect(agent).executeTrade(await token.getAddress(), ethers.parseEther("999"), true)
      ).to.be.revertedWith("Treasury: insufficient native balance");
    });

    it("should revert sell if insufficient token balance", async function () {
      await expect(
        treasury.connect(agent).executeTrade(await token.getAddress(), ethers.parseEther("999999"), false)
      ).to.be.revertedWith("Treasury: insufficient token balance");
    });

    it("should revert trade when allocation exceeds limit", async function () {
      // totalTreasuryValue is 10 ETH, maxAlloc is 20% = 2 ETH
      // Try to buy 3 ETH worth of a token
      await expect(
        treasury.connect(agent).executeTrade(await token.getAddress(), ethers.parseEther("3"), true)
      ).to.be.revertedWith("Treasury: allocation exceeds limit");
    });
  });

  describe("Pause", function () {
    it("should block trades when paused", async function () {
      await treasury.connect(governance).pause();
      await expect(
        treasury.connect(agent).executeTrade(await token.getAddress(), ethers.parseEther("0.1"), true)
      ).to.be.reverted;
    });

    it("should allow trades after unpause", async function () {
      await treasury.connect(governance).pause();
      await treasury.connect(governance).unpause();
      const tx = await treasury.connect(agent).executeTrade(await token.getAddress(), ethers.parseEther("0.1"), true);
      await expect(tx).to.emit(treasury, "TradeExecuted");
    });
  });

  describe("Governance Functions", function () {
    it("should update max allocation", async function () {
      const tx = await treasury.connect(governance).updateMaxAllocation(3000);
      await expect(tx).to.emit(treasury, "RiskUpdated").withArgs(3000, await getBlockTimestamp(tx));
      expect(await treasury.maxAllocationBps()).to.equal(3000);
    });

    it("should reject allocation > 100%", async function () {
      await expect(
        treasury.connect(governance).updateMaxAllocation(10001)
      ).to.be.revertedWith("Treasury: bps > 100%");
    });

    it("should update agent address", async function () {
      const tx = await treasury.connect(governance).updateAgent(user1.address);
      await expect(tx).to.emit(treasury, "AgentUpdated");
      expect(await treasury.agent()).to.equal(user1.address);
    });

    it("should update governance address", async function () {
      const tx = await treasury.connect(governance).updateGovernance(user1.address);
      await expect(tx).to.emit(treasury, "GovernanceUpdated");
      expect(await treasury.governance()).to.equal(user1.address);
    });
  });

  describe("Views", function () {
    it("should report native balance", async function () {
      expect(await treasury.nativeBalance()).to.equal(ethers.parseEther("10"));
    });

    it("should report token balance", async function () {
      expect(await treasury.tokenBalance(await token.getAddress())).to.equal(
        ethers.parseEther("100000")
      );
    });
  });
});

async function getBlockTimestamp(tx) {
  const receipt = await tx.wait();
  const block = await ethers.provider.getBlock(receipt.blockNumber);
  return block.timestamp;
}
