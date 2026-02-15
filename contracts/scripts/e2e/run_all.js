const hre = require("hardhat");
const { header, info, summary } = require("./helpers");
const clawTokenE2E = require("./01_clawtoken");
const treasuryE2E = require("./02_treasury");
const governanceE2E = require("./03_governance");
const profitDistE2E = require("./04_profitdistributor");
const questMgrE2E = require("./05_questmanager");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  header("CLAW.FUND E2E — Live On-Chain Tests");
  info(`Network: ${hre.network.name}`);
  info(`Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  info(`Balance: ${hre.ethers.formatEther(balance)} MON`);

  if (balance < hre.ethers.parseEther("0.5")) {
    console.log("\n⚠️  Low balance — e2e tests need ~0.5 MON for gas + funding. Aborting.");
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════
  // Deploy fresh contract instances for e2e testing
  // Deployer acts as BOTH agent AND governance for full control
  // ═══════════════════════════════════════════════════════
  header("Deploying fresh test contracts...");

  // 1. CLAWToken
  info("Deploying CLAWToken...");
  const CLAWToken = await hre.ethers.getContractFactory("CLAWToken");
  const clawToken = await CLAWToken.deploy(1_000_000);
  await clawToken.waitForDeployment();
  info(`CLAWToken: ${await clawToken.getAddress()}`);

  // 2. AgentTreasury (deployer = agent + governance)
  info("Deploying AgentTreasury...");
  const AgentTreasury = await hre.ethers.getContractFactory("AgentTreasury");
  const treasury = await AgentTreasury.deploy(deployer.address, deployer.address, 2000);
  await treasury.waitForDeployment();
  info(`AgentTreasury: ${await treasury.getAddress()}`);

  // 3. Governance (voting period = 100 blocks for faster testing)
  info("Deploying Governance...");
  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(
    await clawToken.getAddress(),
    await treasury.getAddress(),
    100, // 100 blocks voting period
    hre.ethers.parseEther("100") // min 100 CLAW to propose
  );
  await governance.waitForDeployment();
  info(`Governance: ${await governance.getAddress()}`);

  // 4. ProfitDistributor (deployer = agent + governance)
  info("Deploying ProfitDistributor...");
  const ProfitDistributor = await hre.ethers.getContractFactory("ProfitDistributor");
  const profitDistributor = await ProfitDistributor.deploy(
    await clawToken.getAddress(),
    deployer.address,
    deployer.address,
    await treasury.getAddress(),
    hre.ethers.parseEther("0.01"), // 0.01 MON threshold for testing
    5000 // 50%
  );
  await profitDistributor.waitForDeployment();
  info(`ProfitDistributor: ${await profitDistributor.getAddress()}`);

  // 5. QuestManager (deployer = agent + governance)
  info("Deploying QuestManager...");
  const QuestManager = await hre.ethers.getContractFactory("QuestManager");
  const questManager = await QuestManager.deploy(
    await clawToken.getAddress(),
    deployer.address,
    deployer.address
  );
  await questManager.waitForDeployment();
  info(`QuestManager: ${await questManager.getAddress()}`);

  info("All test contracts deployed!\n");

  // ═══════════════════════════════════════════════════════
  // Run E2E tests
  // ═══════════════════════════════════════════════════════

  await clawTokenE2E.run(clawToken, deployer);
  await treasuryE2E.run(treasury, clawToken, deployer, deployer.address);
  await governanceE2E.run(governance, clawToken, deployer);
  await profitDistE2E.run(profitDistributor, clawToken, deployer);
  await questMgrE2E.run(questManager, clawToken, deployer);

  // ═══════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════
  const failures = summary();

  const balanceAfter = await hre.ethers.provider.getBalance(deployer.address);
  info(`Gas spent: ${hre.ethers.formatEther(balance - balanceAfter)} MON`);
  info(`Balance remaining: ${hre.ethers.formatEther(balanceAfter)} MON`);

  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
