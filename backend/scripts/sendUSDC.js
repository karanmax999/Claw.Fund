require("dotenv").config();
const { ethers } = require("ethers");

// ─── Config ──────────────────────────────────────────────────────

const BASE_RPC = "https://mainnet.base.org";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const USDC_DECIMALS = 6;
const SEND_AMOUNT = "1"; // $1 USDC

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RECIPIENT = process.env.RECIPIENT_ADDRESS;

if (!PRIVATE_KEY || !RECIPIENT) {
  console.error("ERROR: PRIVATE_KEY and RECIPIENT_ADDRESS must be set in .env");
  process.exit(1);
}

// Minimal ERC-20 ABI — only what we need
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

  console.log("═══════════════════════════════════════════");
  console.log("  Claw.Fund — USDC Transfer (Base)");
  console.log("═══════════════════════════════════════════");
  console.log(`  Wallet    : ${wallet.address}`);
  console.log(`  Recipient : ${RECIPIENT}`);
  console.log(`  Amount    : $${SEND_AMOUNT} USDC`);
  console.log("═══════════════════════════════════════════\n");

  // 1. Check USDC balance
  const balance = await usdc.balanceOf(wallet.address);
  const formatted = ethers.formatUnits(balance, USDC_DECIMALS);
  console.log(`USDC Balance: $${formatted}`);

  // 2. Check ETH balance (needed for gas)
  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`ETH  Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

  // 3. Validate sufficient balance
  const amountRaw = ethers.parseUnits(SEND_AMOUNT, USDC_DECIMALS);

  if (balance < amountRaw) {
    console.error(`Insufficient USDC balance. Have $${formatted}, need $${SEND_AMOUNT}`);
    process.exit(1);
  }

  if (ethBalance === 0n) {
    console.error("No ETH for gas fees. Fund the wallet with Base ETH first.");
    process.exit(1);
  }

  // 4. Send USDC
  console.log(`Sending $${SEND_AMOUNT} USDC to ${RECIPIENT}...`);
  const tx = await usdc.transfer(RECIPIENT, amountRaw);
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
