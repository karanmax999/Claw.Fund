const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QuestManager", function () {
  let token, questManager;
  let deployer, agent, governance, user1, user2, attacker;

  const INITIAL_SUPPLY = 1_000_000n;

  beforeEach(async function () {
    [deployer, agent, governance, user1, user2, attacker] = await ethers.getSigners();

    // Deploy CLAW token
    const CLAWToken = await ethers.getContractFactory("CLAWToken");
    token = await CLAWToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();

    // Deploy QuestManager
    const QuestManager = await ethers.getContractFactory("QuestManager");
    questManager = await QuestManager.deploy(
      await token.getAddress(),
      agent.address,
      governance.address
    );
    await questManager.waitForDeployment();

    // Fund QuestManager with native for rewards
    await deployer.sendTransaction({
      to: await questManager.getAddress(),
      value: ethers.parseEther("10"),
    });

    // Give user1 some CLAW
    await token.transfer(user1.address, ethers.parseEther("5000"));
  });

  describe("Deployment", function () {
    it("should set state variables correctly", async function () {
      expect(await questManager.clawToken()).to.equal(await token.getAddress());
      expect(await questManager.agent()).to.equal(agent.address);
      expect(await questManager.governance()).to.equal(governance.address);
    });

    it("should reject zero addresses", async function () {
      const QuestManager = await ethers.getContractFactory("QuestManager");
      await expect(
        QuestManager.deploy(ethers.ZeroAddress, agent.address, governance.address)
      ).to.be.revertedWith("QuestMgr: zero token");
      await expect(
        QuestManager.deploy(await token.getAddress(), ethers.ZeroAddress, governance.address)
      ).to.be.revertedWith("QuestMgr: zero agent");
      await expect(
        QuestManager.deploy(await token.getAddress(), agent.address, ethers.ZeroAddress)
      ).to.be.revertedWith("QuestMgr: zero governance");
    });
  });

  describe("Access Control", function () {
    it("should allow only agent to create quests", async function () {
      await expect(
        questManager.connect(attacker).createQuest("Bad quest", ethers.parseEther("1"), 0, 0)
      ).to.be.revertedWith("QuestMgr: caller is not agent");
    });

    it("should allow only agent to deactivate quests", async function () {
      await questManager.connect(agent).createQuest("Quest 1", ethers.parseEther("0.1"), 0, ethers.parseEther("100"));
      await expect(
        questManager.connect(attacker).deactivateQuest(1)
      ).to.be.revertedWith("QuestMgr: caller is not agent");
    });

    it("should allow only agent to attest quests", async function () {
      await questManager.connect(agent).createQuest("Quest 1", ethers.parseEther("0.1"), 1, 0);
      await expect(
        questManager.connect(attacker).attestQuest(1, user1.address)
      ).to.be.revertedWith("QuestMgr: caller is not agent");
    });

    it("should allow only governance to pause", async function () {
      await expect(
        questManager.connect(attacker).pause()
      ).to.be.revertedWith("QuestMgr: caller is not governance");
    });
  });

  describe("Quest Creation", function () {
    it("should create a HoldTokens quest", async function () {
      const tx = await questManager
        .connect(agent)
        .createQuest("Hold 1000 CLAW", ethers.parseEther("0.5"), 0, ethers.parseEther("1000"));
      await expect(tx).to.emit(questManager, "QuestCreated");
      expect(await questManager.questCount()).to.equal(1);

      const q = await questManager.getQuest(1);
      expect(q.description).to.equal("Hold 1000 CLAW");
      expect(q.reward).to.equal(ethers.parseEther("0.5"));
      expect(q.active).to.be.true;
      expect(q.questType).to.equal(0); // HoldTokens
      expect(q.threshold).to.equal(ethers.parseEther("1000"));
    });

    it("should create a ProvideLiquidity quest", async function () {
      await questManager.connect(agent).createQuest("Provide LP", ethers.parseEther("1"), 1, 0);
      const q = await questManager.getQuest(1);
      expect(q.questType).to.equal(1); // ProvideLiquidity
    });

    it("should create a ParticipateVote quest", async function () {
      await questManager.connect(agent).createQuest("Vote in governance", ethers.parseEther("0.2"), 2, 0);
      const q = await questManager.getQuest(1);
      expect(q.questType).to.equal(2); // ParticipateVote
    });
  });

  describe("Quest Verification – HoldTokens (on-chain)", function () {
    beforeEach(async function () {
      // Create quest: hold >= 1000 CLAW, reward = 0.5 ETH
      await questManager
        .connect(agent)
        .createQuest("Hold 1000 CLAW", ethers.parseEther("0.5"), 0, ethers.parseEther("1000"));
    });

    it("should allow user with enough CLAW to claim", async function () {
      const balBefore = await ethers.provider.getBalance(user1.address);
      const tx = await questManager.connect(user1).verifyAndClaimQuest(1);
      await expect(tx).to.emit(questManager, "QuestCompleted");

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(user1.address);
      expect(balAfter + gasUsed - balBefore).to.equal(ethers.parseEther("0.5"));
    });

    it("should reject user with insufficient CLAW", async function () {
      await expect(
        questManager.connect(attacker).verifyAndClaimQuest(1)
      ).to.be.revertedWith("QuestMgr: insufficient CLAW balance");
    });

    it("should prevent double completion", async function () {
      await questManager.connect(user1).verifyAndClaimQuest(1);
      await expect(
        questManager.connect(user1).verifyAndClaimQuest(1)
      ).to.be.revertedWith("QuestMgr: already completed");
    });
  });

  describe("Quest Verification – Attested (off-chain)", function () {
    beforeEach(async function () {
      // Create LP quest
      await questManager
        .connect(agent)
        .createQuest("Provide LP", ethers.parseEther("1"), 1, 0);
    });

    it("should reject claim without attestation", async function () {
      await expect(
        questManager.connect(user1).verifyAndClaimQuest(1)
      ).to.be.revertedWith("QuestMgr: not attested by agent");
    });

    it("should allow claim after agent attestation", async function () {
      await questManager.connect(agent).attestQuest(1, user1.address);
      expect(await questManager.isAttested(1, user1.address)).to.be.true;

      const tx = await questManager.connect(user1).verifyAndClaimQuest(1);
      await expect(tx).to.emit(questManager, "QuestCompleted");
    });
  });

  describe("Quest Deactivation", function () {
    beforeEach(async function () {
      await questManager
        .connect(agent)
        .createQuest("Hold 100 CLAW", ethers.parseEther("0.1"), 0, ethers.parseEther("100"));
    });

    it("should deactivate a quest", async function () {
      await questManager.connect(agent).deactivateQuest(1);
      const q = await questManager.getQuest(1);
      expect(q.active).to.be.false;
    });

    it("should prevent claiming a deactivated quest", async function () {
      await questManager.connect(agent).deactivateQuest(1);
      await expect(
        questManager.connect(user1).verifyAndClaimQuest(1)
      ).to.be.revertedWith("QuestMgr: quest not active");
    });
  });

  describe("Pause", function () {
    beforeEach(async function () {
      await questManager
        .connect(agent)
        .createQuest("Hold 100 CLAW", ethers.parseEther("0.1"), 0, ethers.parseEther("100"));
    });

    it("should block claims when paused", async function () {
      await questManager.connect(governance).pause();
      await expect(
        questManager.connect(user1).verifyAndClaimQuest(1)
      ).to.be.reverted;
    });

    it("should resume after unpause", async function () {
      await questManager.connect(governance).pause();
      await questManager.connect(governance).unpause();
      await questManager.connect(user1).verifyAndClaimQuest(1);
    });
  });

  describe("Views", function () {
    it("should report hasCompleted", async function () {
      await questManager
        .connect(agent)
        .createQuest("Hold 100 CLAW", ethers.parseEther("0.1"), 0, ethers.parseEther("100"));
      expect(await questManager.hasCompleted(1, user1.address)).to.be.false;
      await questManager.connect(user1).verifyAndClaimQuest(1);
      expect(await questManager.hasCompleted(1, user1.address)).to.be.true;
    });

    it("should report contract balance", async function () {
      expect(await questManager.contractBalance()).to.equal(ethers.parseEther("10"));
    });
  });
});
