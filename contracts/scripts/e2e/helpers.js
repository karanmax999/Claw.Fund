const hre = require("hardhat");

const PASS = "\x1b[32m✅ PASS\x1b[0m";
const FAIL = "\x1b[31m❌ FAIL\x1b[0m";
const INFO = "\x1b[36mℹ️ \x1b[0m";
const HEADER = "\x1b[33m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;

function header(title) {
  console.log(`\n${HEADER}════════════════════════════════════════${RESET}`);
  console.log(`${HEADER}  ${title}${RESET}`);
  console.log(`${HEADER}════════════════════════════════════════${RESET}`);
}

function info(msg) {
  console.log(`${INFO}${msg}`);
}

async function assert(description, fn) {
  try {
    await fn();
    console.log(`  ${PASS}  ${description}`);
    passed++;
  } catch (err) {
    console.log(`  ${FAIL}  ${description}`);
    console.log(`       Error: ${err.message.slice(0, 200)}`);
    failed++;
  }
}

async function assertReverts(description, fn) {
  try {
    await fn();
    console.log(`  ${FAIL}  ${description} (expected revert but succeeded)`);
    failed++;
  } catch (err) {
    console.log(`  ${PASS}  ${description} (reverted as expected)`);
    passed++;
  }
}

function summary() {
  console.log(`\n${HEADER}════════════════════════════════════════${RESET}`);
  console.log(`  Total: ${passed + failed}  |  ${PASS}: ${passed}  |  ${FAIL}: ${failed}`);
  console.log(`${HEADER}════════════════════════════════════════${RESET}\n`);
  return failed;
}

async function waitTx(tx) {
  const receipt = await tx.wait();
  return receipt;
}

module.exports = { header, info, assert, assertReverts, summary, waitTx };
