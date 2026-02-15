const hre = require("hardhat");
const { header, info, assert, assertReverts, summary, waitTx } = require("./helpers");

async function run(questManager, clawToken, deployer) {
  header("E2E: QuestManager");
  const qmAddr = await questManager.getAddress();
  info(`Contract: ${qmAddr}`);

  // 1. Check config
  await assert("agent is deployer", async () => {
    const agent = await questManager.agent();
    if (agent !== deployer.address) throw new Error(`Agent mismatch: ${agent}`);
  });

  await assert("clawToken address matches", async () => {
    const t = await questManager.clawToken();
    if (t !== await clawToken.getAddress()) throw new Error(`Token mismatch`);
  });

  // 2. Fund QuestManager with native MON for rewards
  await assert("fund QuestManager with 0.02 MON", async () => {
    const tx = await deployer.sendTransaction({ to: qmAddr, value: hre.ethers.parseEther("0.02") });
    await waitTx(tx);
    const bal = await questManager.contractBalance();
    if (bal < hre.ethers.parseEther("0.02")) throw new Error(`Balance too low`);
  });

  // 3. Create HoldTokens quest (type 0)
  let holdQuestId;
  await assert("agent creates HoldTokens quest", async () => {
    const tx = await questManager.createQuest(
      "Hold 100 CLAW",
      hre.ethers.parseEther("0.001"), // 0.001 MON reward
      0, // HoldTokens
      hre.ethers.parseEther("100") // threshold: 100 CLAW
    );
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "QuestCreated");
    if (!event) throw new Error("QuestCreated event not emitted");
    holdQuestId = event.args[0];
    info(`  Quest ID: ${holdQuestId}`);
  });

  // 4. Read quest
  await assert("getQuest returns correct data", async () => {
    const q = await questManager.getQuest(holdQuestId);
    if (q.description !== "Hold 100 CLAW") throw new Error("Description mismatch");
    if (!q.active) throw new Error("Quest should be active");
    if (q.questType !== 0n) throw new Error("QuestType should be 0 (HoldTokens)");
    if (q.threshold !== hre.ethers.parseEther("100")) throw new Error("Threshold mismatch");
  });

  // 5. Deployer (who holds CLAW) can verify and claim
  await assert("deployer verifies and claims HoldTokens quest", async () => {
    const balBefore = await hre.ethers.provider.getBalance(deployer.address);
    const tx = await questManager.verifyAndClaimQuest(holdQuestId);
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "QuestCompleted");
    if (!event) throw new Error("QuestCompleted event not emitted");
    info(`  Reward claimed: ${hre.ethers.formatEther(event.args[2])} MON`);
  });

  // 6. Double claim reverts
  await assertReverts("double claim reverts", async () => {
    await questManager.verifyAndClaimQuest(holdQuestId);
  });

  // 7. hasCompleted returns true
  await assert("hasCompleted returns true for deployer", async () => {
    const done = await questManager.hasCompleted(holdQuestId, deployer.address);
    if (!done) throw new Error("Should be completed");
  });

  // 8. Create LP quest (type 1) requiring attestation
  let lpQuestId;
  await assert("agent creates ProvideLiquidity quest", async () => {
    const tx = await questManager.createQuest(
      "Provide LP on Nad.fun",
      hre.ethers.parseEther("0.002"),
      1, // ProvideLiquidity
      0  // threshold N/A for attested quests
    );
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "QuestCreated");
    lpQuestId = event.args[0];
    info(`  LP Quest ID: ${lpQuestId}`);
  });

  // 9. Claim without attestation reverts
  await assertReverts("claim LP quest without attestation reverts", async () => {
    await questManager.verifyAndClaimQuest(lpQuestId);
  });

  // 10. Agent attests, then claim works
  await assert("agent attests deployer for LP quest", async () => {
    const tx = await questManager.attestQuest(lpQuestId, deployer.address);
    await waitTx(tx);
    const attested = await questManager.isAttested(lpQuestId, deployer.address);
    if (!attested) throw new Error("Not attested");
  });

  await assert("deployer claims attested LP quest", async () => {
    const tx = await questManager.verifyAndClaimQuest(lpQuestId);
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "QuestCompleted");
    if (!event) throw new Error("QuestCompleted event not emitted");
  });

  // 11. Deactivate quest
  await assert("agent deactivates HoldTokens quest", async () => {
    const tx = await questManager.deactivateQuest(holdQuestId);
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "QuestDeactivated");
    if (!event) throw new Error("QuestDeactivated event not emitted");
    const q = await questManager.getQuest(holdQuestId);
    if (q.active) throw new Error("Quest should be deactivated");
  });

  // 12. Non-agent cannot create quest
  const randomWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  await assertReverts("non-agent cannot create quest", async () => {
    await questManager.connect(randomWallet).createQuest("hack", 1n, 0, 0);
  });

  // 13. Pause blocks claims
  // Create a fresh quest for pause test
  let pauseQuestId;
  await assert("create quest for pause test", async () => {
    const tx = await questManager.createQuest("Pause test quest", hre.ethers.parseEther("0.001"), 0, 1n);
    const receipt = await waitTx(tx);
    pauseQuestId = receipt.logs.find(l => l.fragment && l.fragment.name === "QuestCreated").args[0];
  });

  await assert("governance pauses QuestManager", async () => {
    const tx = await questManager.pause();
    await waitTx(tx);
    if (!(await questManager.paused())) throw new Error("Not paused");
  });

  await assertReverts("claim reverts when paused", async () => {
    await questManager.verifyAndClaimQuest(pauseQuestId);
  });

  await assert("governance unpauses QuestManager", async () => {
    const tx = await questManager.unpause();
    await waitTx(tx);
  });

  // 14. questCount check
  await assert("questCount >= 3", async () => {
    const count = await questManager.questCount();
    if (count < 3n) throw new Error(`questCount ${count} < 3`);
  });
}

module.exports = { run };
