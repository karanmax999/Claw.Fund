const hre = require("hardhat");
const { header, info, assert, assertReverts, summary, waitTx } = require("./helpers");

async function run(profitDistributor, clawToken, deployer) {
  header("E2E: ProfitDistributor");
  const pdAddr = await profitDistributor.getAddress();
  info(`Contract: ${pdAddr}`);

  // 1. Check config
  await assert("agent is deployer", async () => {
    const agent = await profitDistributor.agent();
    if (agent !== deployer.address) throw new Error(`Agent mismatch: ${agent}`);
  });

  await assert("profitThreshold is 0.01 MON", async () => {
    const t = await profitDistributor.profitThreshold();
    const expected = hre.ethers.parseEther("0.01");
    if (t !== expected) throw new Error(`Threshold ${t} != ${expected}`);
  });

  await assert("distributionBps is 5000 (50%)", async () => {
    const bps = await profitDistributor.distributionBps();
    if (bps !== 5000n) throw new Error(`Bps ${bps} != 5000`);
  });

  // 2. Fund ProfitDistributor with native MON for rewards
  await assert("fund ProfitDistributor with 0.02 MON", async () => {
    const tx = await deployer.sendTransaction({ to: pdAddr, value: hre.ethers.parseEther("0.02") });
    await waitTx(tx);
    const bal = await profitDistributor.contractBalance();
    if (bal < hre.ethers.parseEther("0.02")) throw new Error(`Balance too low: ${bal}`);
  });

  // 3. Sync treasury value (first time, from 0 → 1 MON)
  await assert("agent syncs treasury value to 1 MON", async () => {
    const tx = await profitDistributor.syncTreasuryValue(hre.ethers.parseEther("1"));
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "TreasuryValueSynced");
    if (!event) throw new Error("TreasuryValueSynced event not emitted");
    info(`  Synced: prev=${hre.ethers.formatEther(event.args[0])}, curr=${hre.ethers.formatEther(event.args[1])}, profit=${hre.ethers.formatEther(event.args[2])}`);
  });

  await assert("lastSnapshotValue updated to 1 MON", async () => {
    const val = await profitDistributor.lastSnapshotValue();
    if (val !== hre.ethers.parseEther("1")) throw new Error(`Snapshot ${val}`);
  });

  // 4. Small profit below threshold — no distribution event
  await assert("sub-threshold sync does NOT emit ProfitDistributed", async () => {
    const tx = await profitDistributor.syncTreasuryValue(hre.ethers.parseEther("1.005"));
    const receipt = await waitTx(tx);
    const profitEvent = receipt.logs.find(l => l.fragment && l.fragment.name === "ProfitDistributed");
    if (profitEvent) throw new Error("ProfitDistributed should NOT fire for sub-threshold");
  });

  // 5. Profit above threshold triggers distribution event
  const pendingBefore = await profitDistributor.pendingDistribution();
  await assert("above-threshold sync emits ProfitDistributed", async () => {
    const tx = await profitDistributor.syncTreasuryValue(hre.ethers.parseEther("1.05"));
    const receipt = await waitTx(tx);
    const profitEvent = receipt.logs.find(l => l.fragment && l.fragment.name === "ProfitDistributed");
    if (!profitEvent) throw new Error("ProfitDistributed event not emitted");
    info(`  Distributed amount: ${hre.ethers.formatEther(profitEvent.args[0])} MON`);
  });

  await assert("pendingDistribution increased", async () => {
    const pendingAfter = await profitDistributor.pendingDistribution();
    if (pendingAfter <= pendingBefore) throw new Error(`Pending not increased: ${pendingAfter}`);
  });

  // 6. Distribute to a holder
  const holder = hre.ethers.Wallet.createRandom().address;
  const distAmt = hre.ethers.parseEther("0.001");
  await assert("distributeTo sends MON to holder", async () => {
    const balBefore = await hre.ethers.provider.getBalance(holder);
    const tx = await profitDistributor.distributeTo([holder], [distAmt]);
    const receipt = await waitTx(tx);
    const balAfter = await hre.ethers.provider.getBalance(holder);
    if (balAfter - balBefore !== distAmt) throw new Error(`Balance delta mismatch`);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "RewardClaimed");
    if (!event) throw new Error("RewardClaimed event not emitted");
  });

  // 7. Distribute with mismatched arrays reverts
  await assertReverts("distributeTo with length mismatch reverts", async () => {
    await profitDistributor.distributeTo([holder], []);
  });

  // 8. Non-agent cannot sync
  const randomWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  await assertReverts("non-agent cannot syncTreasuryValue", async () => {
    await profitDistributor.connect(randomWallet).syncTreasuryValue(hre.ethers.parseEther("2"));
  });

  // 9. Governance updates threshold
  await assert("governance updates profitThreshold", async () => {
    const tx = await profitDistributor.updateProfitThreshold(hre.ethers.parseEther("0.5"));
    await waitTx(tx);
    const t = await profitDistributor.profitThreshold();
    if (t !== hre.ethers.parseEther("0.5")) throw new Error(`Threshold ${t}`);
  });

  // 10. Pause blocks sync
  await assert("governance pauses ProfitDistributor", async () => {
    const tx = await profitDistributor.pause();
    await waitTx(tx);
    if (!(await profitDistributor.paused())) throw new Error("Not paused");
  });

  await assertReverts("sync reverts when paused", async () => {
    await profitDistributor.syncTreasuryValue(hre.ethers.parseEther("2"));
  });

  await assert("governance unpauses ProfitDistributor", async () => {
    const tx = await profitDistributor.unpause();
    await waitTx(tx);
    if (await profitDistributor.paused()) throw new Error("Still paused");
  });
}

module.exports = { run };
