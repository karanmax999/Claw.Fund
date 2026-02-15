const hre = require("hardhat");
const { header, info, assert, assertReverts, summary, waitTx } = require("./helpers");

async function run(clawToken, deployer) {
  header("E2E: CLAWToken");
  const addr = await clawToken.getAddress();
  info(`Contract: ${addr}`);

  // 1. Basic metadata
  await assert("name() returns CLAW", async () => {
    const name = await clawToken.name();
    if (name !== "CLAW") throw new Error(`Expected CLAW, got ${name}`);
  });

  await assert("symbol() returns CLAW", async () => {
    const symbol = await clawToken.symbol();
    if (symbol !== "CLAW") throw new Error(`Expected CLAW, got ${symbol}`);
  });

  await assert("decimals() returns 18", async () => {
    const d = await clawToken.decimals();
    if (d !== 18n) throw new Error(`Expected 18, got ${d}`);
  });

  // 2. Supply check
  await assert("totalSupply is 1M * 10^18", async () => {
    const supply = await clawToken.totalSupply();
    const expected = hre.ethers.parseEther("1000000");
    if (supply !== expected) throw new Error(`Supply mismatch: ${supply}`);
  });

  // 3. Deployer balance
  await assert("deployer holds the full supply", async () => {
    const bal = await clawToken.balanceOf(deployer.address);
    const supply = await clawToken.totalSupply();
    if (bal !== supply) throw new Error(`Balance ${bal} != supply ${supply}`);
  });

  // 4. Transfer
  const randomAddr = hre.ethers.Wallet.createRandom().address;
  const transferAmt = hre.ethers.parseEther("100");
  await assert("transfer 100 CLAW to random address", async () => {
    const tx = await clawToken.transfer(randomAddr, transferAmt);
    await waitTx(tx);
    const bal = await clawToken.balanceOf(randomAddr);
    if (bal !== transferAmt) throw new Error(`Recipient bal ${bal} != ${transferAmt}`);
  });

  // 5. Approve + allowance
  await assert("approve spender for 500 CLAW", async () => {
    const spender = hre.ethers.Wallet.createRandom().address;
    const amt = hre.ethers.parseEther("500");
    const tx = await clawToken.approve(spender, amt);
    await waitTx(tx);
    const allowance = await clawToken.allowance(deployer.address, spender);
    if (allowance !== amt) throw new Error(`Allowance ${allowance} != ${amt}`);
  });

  // 6. Burn
  await assert("burn 10 CLAW reduces totalSupply", async () => {
    const supplyBefore = await clawToken.totalSupply();
    const burnAmt = hre.ethers.parseEther("10");
    const tx = await clawToken.burn(burnAmt);
    await waitTx(tx);
    const supplyAfter = await clawToken.totalSupply();
    if (supplyAfter !== supplyBefore - burnAmt) throw new Error(`Supply not reduced`);
  });

  // 7. Transfer from zero-balance address should revert
  const noBalWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  await assertReverts("transfer from zero-balance address reverts", async () => {
    await clawToken.connect(noBalWallet).transfer(deployer.address, 1n);
  });
}

module.exports = { run };
