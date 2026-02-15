const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CLAWToken", function () {
  let token;
  let deployer, user1, user2;

  const INITIAL_SUPPLY = 1_000_000n; // 1M tokens
  const TOTAL_WEI = INITIAL_SUPPLY * 10n ** 18n;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();
    const CLAWToken = await ethers.getContractFactory("CLAWToken");
    token = await CLAWToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set correct name and symbol", async function () {
      expect(await token.name()).to.equal("CLAW");
      expect(await token.symbol()).to.equal("CLAW");
    });

    it("should have 18 decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("should mint total supply to deployer", async function () {
      expect(await token.totalSupply()).to.equal(TOTAL_WEI);
      expect(await token.balanceOf(deployer.address)).to.equal(TOTAL_WEI);
    });

    it("should revert on zero supply", async function () {
      const CLAWToken = await ethers.getContractFactory("CLAWToken");
      await expect(CLAWToken.deploy(0)).to.be.revertedWith("CLAWToken: zero supply");
    });
  });

  describe("Transfers", function () {
    it("should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("1000");
      await token.transfer(user1.address, amount);
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("should fail transfer with insufficient balance", async function () {
      const amount = ethers.parseEther("1");
      await expect(
        token.connect(user1).transfer(deployer.address, amount)
      ).to.be.reverted;
    });
  });

  describe("Approvals & TransferFrom", function () {
    it("should approve and transferFrom", async function () {
      const amount = ethers.parseEther("500");
      await token.approve(user1.address, amount);
      expect(await token.allowance(deployer.address, user1.address)).to.equal(amount);

      await token.connect(user1).transferFrom(deployer.address, user2.address, amount);
      expect(await token.balanceOf(user2.address)).to.equal(amount);
    });
  });

  describe("Burn", function () {
    it("should allow holders to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      await token.burn(burnAmount);
      expect(await token.totalSupply()).to.equal(TOTAL_WEI - burnAmount);
    });
  });
});
