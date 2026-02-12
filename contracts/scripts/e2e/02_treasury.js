const hre = require("hardhat");
const { header, info, assert, assertReverts, summary, waitTx } = require("./helpers");

async function run(treasury, clawToken, deployer, governance) {
  header("E2E: AgentTreasury");
  const treasuryAddr = await treasury.getAddress();
  const tokenAddr = await clawToken.getAddress();
  info(`Contract: ${treasuryAddr}`);

  // 1. Check roles
  await assert("agent is deployer", async () => {
    const agent = await treasury.agent();
    if (agent !== deployer.address) throw new Error(`Agent mismatch: ${agent}`);
  });

  await assert("governance is set correctly", async () => {
    const gov = await treasury.governance();
    if (gov !== governance) throw new Error(`Governance mismatch: ${gov}`);
  });

  await assert("maxAllocationBps is 2000 (20%)", async () => {
    const bps = await treasury.maxAllocationBps();
    if (bps !== 2000n) throw new Error(`MaxAlloc ${bps} != 2000`);
  });

  // 2. Fund treasury with native MON
  const fundAmt = hre.ethers.parseEther("0.05");
  await assert("fund treasury with 0.05 MON", async () => {
    const tx = await deployer.sendTransaction({ to: treasuryAddr, value: fundAmt });
    await waitTx(tx);
    const bal = await treasury.nativeBalance();
    if (bal < fundAmt) throw new Error(`Native bal ${bal} < ${fundAmt}`);
  });

  // 3. Transfer CLAW tokens to treasury
  const tokenAmt = hre.ethers.parseEther("1000");
  await assert("transfer 1000 CLAW to treasury", async () => {
    const tx = await clawToken.transfer(treasuryAddr, tokenAmt);
    await waitTx(tx);
    const bal = await treasury.tokenBalance(tokenAddr);
    if (bal < tokenAmt) throw new Error(`Token bal ${bal} < ${tokenAmt}`);
  });

  // 4. Whitelist CLAW token for trading (governance action)
  await assert("governance whitelists CLAW token", async () => {
    const tx = await treasury.setTokenAllowed(tokenAddr, true);
    await waitTx(tx);
    const allowed = await treasury.allowedTokens(tokenAddr);
    if (!allowed) throw new Error("Token not allowed after whitelist");
  });

  // 5. Set treasury value (agent action)
  const treasuryVal = hre.ethers.parseEther("1");
  await assert("agent updates treasury value", async () => {
    const tx = await treasury.updateTreasuryValue(treasuryVal);
    await waitTx(tx);
    const val = await treasury.totalTreasuryValue();
    if (val !== treasuryVal) throw new Error(`Value ${val} != ${treasuryVal}`);
  });

  // 6. Execute a SELL trade (send tokens out)
  const sellAmt = hre.ethers.parseEther("50");
  await assert("agent executes SELL trade (send CLAW out)", async () => {
    const balBefore = await clawToken.balanceOf(deployer.address);
    const tx = await treasury.executeTrade(tokenAddr, sellAmt, false);
    const receipt = await waitTx(tx);
    const balAfter = await clawToken.balanceOf(deployer.address);
    if (balAfter - balBefore !== sellAmt) throw new Error("Sell amount mismatch");
    // Check TradeExecuted event
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "TradeExecuted");
    if (!event) throw new Error("TradeExecuted event not emitted");
  });

  // 7. Execute a BUY trade (send native out) - small amount within allocation
  const buyAmt = hre.ethers.parseEther("0.01");
  await assert("agent executes BUY trade (send MON out)", async () => {
    const tx = await treasury.executeTrade(tokenAddr, buyAmt, true);
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "TradeExecuted");
    if (!event) throw new Error("TradeExecuted event not emitted");
  });

  // 8. Trade for disallowed token should revert
  const fakeToken = hre.ethers.Wallet.createRandom().address;
  await assertReverts("trade on non-whitelisted token reverts", async () => {
    await treasury.executeTrade(fakeToken, hre.ethers.parseEther("0.001"), true);
  });

  // 9. Zero amount trade reverts
  await assertReverts("zero amount trade reverts", async () => {
    await treasury.executeTrade(tokenAddr, 0n, true);
  });

  // 10. Pause / unpause
  await assert("governance pauses treasury", async () => {
    const tx = await treasury.pause();
    await waitTx(tx);
    const paused = await treasury.paused();
    if (!paused) throw new Error("Not paused");
  });

  await assertReverts("trade reverts when paused", async () => {
    await treasury.executeTrade(tokenAddr, hre.ethers.parseEther("0.001"), true);
  });

  await assert("governance unpauses treasury", async () => {
    const tx = await treasury.unpause();
    await waitTx(tx);
    const paused = await treasury.paused();
    if (paused) throw new Error("Still paused");
  });

  // 11. Update risk params
  await assert("governance updates maxAllocation to 3000 bps", async () => {
    const tx = await treasury.updateMaxAllocation(3000n);
    const receipt = await waitTx(tx);
    const bps = await treasury.maxAllocationBps();
    if (bps !== 3000n) throw new Error(`MaxAlloc ${bps} != 3000`);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "RiskUpdated");
    if (!event) throw new Error("RiskUpdated event not emitted");
  });

  // 12. Non-agent cannot trade
  const randomWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  await assertReverts("non-agent cannot execute trade", async () => {
    await treasury.connect(randomWallet).executeTrade(tokenAddr, 1n, true);
  });
}

module.exports = { run };
