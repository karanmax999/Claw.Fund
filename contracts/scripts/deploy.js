const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const AGENT_ADDRESS = process.env.AGENT_ADDRESS || deployer.address;
  console.log("Agent address:", AGENT_ADDRESS);

  // ──────────────────── 1. Deploy CLAWToken ────────────────────
  console.log("\n--- Deploying CLAWToken ---");
  const CLAWToken = await hre.ethers.getContractFactory("CLAWToken");
  const INITIAL_SUPPLY = 1_000_000; // 1M tokens
  const clawToken = await CLAWToken.deploy(INITIAL_SUPPLY);
  await clawToken.waitForDeployment();
  const clawTokenAddr = await clawToken.getAddress();
  console.log("CLAWToken deployed to:", clawTokenAddr);

  // ──────────────────── 2. Deploy AgentTreasury ────────────────
  console.log("\n--- Deploying AgentTreasury ---");
  const AgentTreasury = await hre.ethers.getContractFactory("AgentTreasury");
  const MAX_ALLOC_BPS = 2000; // 20%
  const treasury = await AgentTreasury.deploy(AGENT_ADDRESS, deployer.address, MAX_ALLOC_BPS);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("AgentTreasury deployed to:", treasuryAddr);

  // ──────────────────── 3. Deploy Governance ───────────────────
  console.log("\n--- Deploying Governance ---");
  const Governance = await hre.ethers.getContractFactory("Governance");
  const VOTING_PERIOD = 7200; // ~1 day at 12s blocks
  const MIN_PROPOSAL_TOKENS = hre.ethers.parseEther("100"); // 100 CLAW
  const governance = await Governance.deploy(
    clawTokenAddr,
    treasuryAddr,
    VOTING_PERIOD,
    MIN_PROPOSAL_TOKENS
  );
  await governance.waitForDeployment();
  const governanceAddr = await governance.getAddress();
  console.log("Governance deployed to:", governanceAddr);

  // ──────────────────── 4. Deploy ProfitDistributor ────────────
  console.log("\n--- Deploying ProfitDistributor ---");
  const ProfitDistributor = await hre.ethers.getContractFactory("ProfitDistributor");
  const PROFIT_THRESHOLD = hre.ethers.parseEther("1"); // 1 MON
  const DISTRIBUTION_BPS = 5000; // 50%
  const profitDistributor = await ProfitDistributor.deploy(
    clawTokenAddr,
    AGENT_ADDRESS,
    deployer.address, // governance role (deployer acts as gov initially)
    treasuryAddr,
    PROFIT_THRESHOLD,
    DISTRIBUTION_BPS
  );
  await profitDistributor.waitForDeployment();
  const profitDistributorAddr = await profitDistributor.getAddress();
  console.log("ProfitDistributor deployed to:", profitDistributorAddr);

  // ──────────────────── 5. Deploy QuestManager ─────────────────
  console.log("\n--- Deploying QuestManager ---");
  const QuestManager = await hre.ethers.getContractFactory("QuestManager");
  const questManager = await QuestManager.deploy(
    clawTokenAddr,
    AGENT_ADDRESS,
    deployer.address // governance role
  );
  await questManager.waitForDeployment();
  const questManagerAddr = await questManager.getAddress();
  console.log("QuestManager deployed to:", questManagerAddr);

  // ──────────────────── 6. Post-deployment Config ──────────────
  console.log("\n--- Post-deployment Configuration ---");

  // Update AgentTreasury governance to the Governance contract
  console.log("Setting AgentTreasury governance to Governance contract...");
  const txGov = await treasury.updateGovernance(governanceAddr);
  await txGov.wait();
  console.log("AgentTreasury governance updated to:", governanceAddr);

  // ──────────────────── 7. Export Deployment Info ──────────────
  const deployment = {
    network: hre.network.name,
    deployer: deployer.address,
    agent: AGENT_ADDRESS,
    timestamp: new Date().toISOString(),
    contracts: {
      CLAWToken: {
        address: clawTokenAddr,
        initialSupply: `${INITIAL_SUPPLY} (${INITIAL_SUPPLY}e18 wei)`,
      },
      AgentTreasury: {
        address: treasuryAddr,
        maxAllocationBps: MAX_ALLOC_BPS,
      },
      Governance: {
        address: governanceAddr,
        votingPeriod: VOTING_PERIOD,
        minProposalTokens: MIN_PROPOSAL_TOKENS.toString(),
      },
      ProfitDistributor: {
        address: profitDistributorAddr,
        profitThreshold: PROFIT_THRESHOLD.toString(),
        distributionBps: DISTRIBUTION_BPS,
      },
      QuestManager: {
        address: questManagerAddr,
      },
    },
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment info saved to: ${outputPath}`);

  // ──────────────────── 8. Export ABIs ─────────────────────────
  const abiDir = path.join(__dirname, "..", "abi");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const contracts = ["CLAWToken", "AgentTreasury", "Governance", "ProfitDistributor", "QuestManager"];
  for (const name of contracts) {
    const artifact = await hre.artifacts.readArtifact(name);
    const abiPath = path.join(abiDir, `${name}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`ABI exported: ${abiPath}`);
  }

  // ──────────────────── Summary ────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║       CLAW.FUND Deployment Complete          ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║ CLAWToken:         ${clawTokenAddr}`);
  console.log(`║ AgentTreasury:     ${treasuryAddr}`);
  console.log(`║ Governance:        ${governanceAddr}`);
  console.log(`║ ProfitDistributor: ${profitDistributorAddr}`);
  console.log(`║ QuestManager:      ${questManagerAddr}`);
  console.log("╚══════════════════════════════════════════════╝");

  console.log("\n⚠️  Next Steps:");
  console.log("1. Fund the AgentTreasury with native MON tokens");
  console.log("2. Transfer $CLAW tokens to AgentTreasury as needed");
  console.log("3. Use Governance contract to whitelist trading tokens via setTokenAllowed()");
  console.log("4. Fund ProfitDistributor and QuestManager with native MON for rewards");
  console.log("5. Verify contracts on the block explorer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
