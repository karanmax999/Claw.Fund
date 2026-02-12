require("dotenv").config();
const { ethers } = require("ethers");

// ─── Config ──────────────────────────────────────────────────────

const BASE_RPC = "https://mainnet.base.org";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RECIPIENT = process.env.RECIPIENT_ADDRESS;

if (!PRIVATE_KEY || !RECIPIENT) {
  console.error("ERROR: PRIVATE_KEY and RECIPIENT_ADDRESS must be set in .env");
  process.exit(1);
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("═══════════════════════════════════════════");
  console.log("  Claw.Fund — ETH Transfer (Base)");
  console.log("═══════════════════════════════════════════");
  console.log(`  Wallet    : ${wallet.address}`);
  console.log(`  Recipient : ${RECIPIENT}`);
  console.log("═══════════════════════════════════════════\n");

  // 1. Check ETH balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`ETH Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("No ETH in wallet. Nothing to send.");
    process.exit(1);
  }

  // 2. Estimate gas for a simple ETH transfer
  const gasLimit = 21000n;
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas;
  // Add 20% buffer to gas estimate to handle fluctuation
  const gasCost = (gasLimit * maxFeePerGas * 120n) / 100n;

  console.log(`Gas cost   : ~${ethers.formatEther(gasCost)} ETH\n`);

  // 3. Calculate max sendable amount (balance - gas)
  const sendAmount = balance - gasCost;

  if (sendAmount <= 0n) {
    console.error("Balance too low to cover gas fees.");
    process.exit(1);
  }

  console.log(`Sending    : ${ethers.formatEther(sendAmount)} ETH to ${RECIPIENT}...`);

  // 4. Send ETH
  const tx = await wallet.sendTransaction({
    to: RECIPIENT,
    value: sendAmount,
    gasLimit: gasLimit,
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  });

  console.log(`TX submitted: ${tx.hash}`);
  console.log("Waiting for confirmation...\n");

  const receipt = await tx.wait();
  console.log("✓ Transaction confirmed!");
  console.log(`  Block  : ${receipt.blockNumber}`);
  console.log(`  TX Hash: ${receipt.hash}`);
  console.log(`  Gas    : ${ethers.formatEther(receipt.gasUsed * receipt.gasPrice)} ETH`);
  console.log(`\n  View: https://basescan.org/tx/${receipt.hash}`);
}

main().catch((err) => {
  console.error("Transaction failed:", err.message || err);
  process.exit(1);
});
