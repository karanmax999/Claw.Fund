const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfitDistributor", function () {
  let token, distributor;
  let deployer, agent, governance, treasury, holder1, holder2, attacker;

  const INITIAL_SUPPLY = 1_000_000n;
  const PROFIT_THRESHOLD = ethers.parseEther("1"); // 1 ETH profit threshold
  const DISTRIBUTION_BPS = 5000n; // 50%

  beforeEach(async function () {
    [deployer, agent, governance, treasury, holder1, holder2, attacker] =
      await ethers.getSigners();

    // Deploy CLAW token
    const CLAWToken = await ethers.getContractFactory("CLAWToken");
    token = await CLAWToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();

    // Deploy ProfitDistributor
    const ProfitDistributor = await ethers.getContractFactory("ProfitDistributor");
    distributor = await ProfitDistributor.deploy(
      await token.getAddress(),
      agent.address,
      governance.address,
      treasury.address,
      PROFIT_THRESHOLD,
      DISTRIBUTION_BPS
    );
    await distributor.waitForDeployment();

    // Fund distributor with native ETH for rewards
    await deployer.sendTransaction({
      to: await distributor.getAddress(),
      value: ethers.parseEther("20"),
    });
  });

  describe("Deployment", function () {
    it("should set state variables correctly", async function () {
      expect(await distributor.agent()).to.equal(agent.address);
      expect(await distributor.governance()).to.equal(governance.address);
      expect(await distributor.treasury()).to.equal(treasury.address);
      expect(await distributor.profitThreshold()).to.equal(PROFIT_THRESHOLD);
      expect(await distributor.distributionBps()).to.equal(DISTRIBUTION_BPS);
    });

    it("should reject zero token", async function () {
      const ProfitDistributor = await ethers.getContractFactory("ProfitDistributor");
      await expect(
        ProfitDistributor.deploy(
          ethers.ZeroAddress, agent.address, governance.address,
          treasury.address, PROFIT_THRESHOLD, DISTRIBUTION_BPS
        )
      ).to.be.revertedWith("ProfitDist: zero token");
    });

    it("should reject bps > 100%", async function () {
      const ProfitDistributor = await ethers.getContractFactory("ProfitDistributor");
      await expect(
        ProfitDistributor.deploy(
          await token.getAddress(), agent.address, governance.address,
          treasury.address, PROFIT_THRESHOLD, 10001
        )
      ).to.be.revertedWith("ProfitDist: bps > 100%");
    });
  });

  describe("Access Control", function () {
    it("should allow only agent to sync treasury value", async function () {
      await expect(
        distributor.connect(attacker).syncTreasuryValue(ethers.parseEther("100"))
      ).to.be.revertedWith("ProfitDist: caller is not agent");
    });

    it("should allow only agent to distribute", async function () {
      await expect(
        distributor.connect(attacker).distributeTo([holder1.address], [ethers.parseEther("1")])
      ).to.be.revertedWith("ProfitDist: caller is not agent");
    });

    it("should allow only governance to pause", async function () {
      await expect(
        distributor.connect(attacker).pause()
      ).to.be.revertedWith("ProfitDist: caller is not governance");
    });

    it("should allow only governance to update threshold", async function () {
      await expect(
        distributor.connect(attacker).updateProfitThreshold(0)
      ).to.be.revertedWith("ProfitDist: caller is not governance");
    });

    it("should allow only governance to update distribution bps", async function () {
      await expect(
        distributor.connect(attacker).updateDistributionBps(1000)
      ).to.be.revertedWith("ProfitDist: caller is not governance");
    });
  });

  describe("Profit Threshold Logic", function () {
    it("should NOT trigger distribution when profit < threshold", async function () {
      // Set initial snapshot
      await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("100"));
      // Small profit (0.5 ETH < 1 ETH threshold)
      const tx = await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("100.5"));

      await expect(tx).to.emit(distributor, "TreasuryValueSynced");
      // No ProfitDistributed event
      const receipt = await tx.wait();
      const profitEvents = receipt.logs.filter(
        (l) => l.fragment && l.fragment.name === "ProfitDistributed"
      );
      expect(profitEvents.length).to.equal(0);
    });

    it("should trigger distribution when profit >= threshold", async function () {
      await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("100"));
      const pendingBefore = await distributor.pendingDistribution();

      // Profit = 2 ETH >= 1 ETH threshold
      const tx = await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("102"));
      await expect(tx).to.emit(distributor, "ProfitDistributed");

      const pendingAfter = await distributor.pendingDistribution();
      // 50% of 2 ETH profit = 1 ETH added
      expect(pendingAfter - pendingBefore).to.equal(ethers.parseEther("1"));
    });

    it("should update lastSnapshotValue on profit", async function () {
      await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("100"));
      await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("105"));
      expect(await distributor.lastSnapshotValue()).to.equal(ethers.parseEther("105"));
    });

    it("should handle value decrease gracefully", async function () {
      await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("100"));
      await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("90"));
      expect(await distributor.lastSnapshotValue()).to.equal(ethers.parseEther("90"));
    });
  });

  describe("Distribution", function () {
    it("should distribute native tokens to holders", async function () {
      const amount1 = ethers.parseEther("1");
      const amount2 = ethers.parseEther("0.5");

      const bal1Before = await ethers.provider.getBalance(holder1.address);
      const bal2Before = await ethers.provider.getBalance(holder2.address);

      await distributor
        .connect(agent)
        .distributeTo([holder1.address, holder2.address], [amount1, amount2]);

      const bal1After = await ethers.provider.getBalance(holder1.address);
      const bal2After = await ethers.provider.getBalance(holder2.address);

      expect(bal1After - bal1Before).to.equal(amount1);
      expect(bal2After - bal2Before).to.equal(amount2);
    });

    it("should emit RewardClaimed events", async function () {
      const tx = await distributor
        .connect(agent)
        .distributeTo([holder1.address], [ethers.parseEther("1")]);
      await expect(tx).to.emit(distributor, "RewardClaimed");
    });

    it("should revert on length mismatch", async function () {
      await expect(
        distributor.connect(agent).distributeTo([holder1.address], [])
      ).to.be.revertedWith("ProfitDist: length mismatch");
    });

    it("should revert on empty arrays", async function () {
      await expect(
        distributor.connect(agent).distributeTo([], [])
      ).to.be.revertedWith("ProfitDist: empty arrays");
    });

    it("should revert if insufficient balance", async function () {
      await expect(
        distributor.connect(agent).distributeTo(
          [holder1.address],
          [ethers.parseEther("999")]
        )
      ).to.be.revertedWith("ProfitDist: insufficient balance");
    });
  });

  describe("Pause", function () {
    it("should block syncTreasuryValue when paused", async function () {
      await distributor.connect(governance).pause();
      await expect(
        distributor.connect(agent).syncTreasuryValue(ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("should block distributeTo when paused", async function () {
      await distributor.connect(governance).pause();
      await expect(
        distributor.connect(agent).distributeTo([holder1.address], [ethers.parseEther("1")])
      ).to.be.reverted;
    });

    it("should resume after unpause", async function () {
      await distributor.connect(governance).pause();
      await distributor.connect(governance).unpause();
      await distributor.connect(agent).syncTreasuryValue(ethers.parseEther("100"));
    });
  });

  describe("Governance Functions", function () {
    it("should update profit threshold", async function () {
      await distributor.connect(governance).updateProfitThreshold(ethers.parseEther("5"));
      expect(await distributor.profitThreshold()).to.equal(ethers.parseEther("5"));
    });

    it("should update distribution bps", async function () {
      await distributor.connect(governance).updateDistributionBps(3000);
      expect(await distributor.distributionBps()).to.equal(3000);
    });

    it("should reject distribution bps > 100%", async function () {
      await expect(
        distributor.connect(governance).updateDistributionBps(10001)
      ).to.be.revertedWith("ProfitDist: bps > 100%");
    });
  });
});
