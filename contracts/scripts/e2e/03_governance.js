const hre = require("hardhat");
const { header, info, assert, assertReverts, summary, waitTx } = require("./helpers");

async function run(governance, clawToken, deployer) {
  header("E2E: Governance");
  const govAddr = await governance.getAddress();
  info(`Contract: ${govAddr}`);

  // 1. Check config
  await assert("clawToken address matches", async () => {
    const t = await governance.clawToken();
    const expected = await clawToken.getAddress();
    if (t !== expected) throw new Error(`Token mismatch: ${t}`);
  });

  await assert("votingPeriod is 100 blocks (test value)", async () => {
    const vp = await governance.votingPeriod();
    if (vp !== 100n) throw new Error(`VotingPeriod ${vp} != 100`);
  });

  // 2. Create proposal (deployer has CLAW)
  let proposalId;
  await assert("create proposal 'Increase risk to 30%'", async () => {
    const tx = await governance.createProposal("Increase risk to 30%");
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "ProposalCreated");
    if (!event) throw new Error("ProposalCreated event not emitted");
    proposalId = event.args[0];
    info(`  Proposal ID: ${proposalId}`);
  });

  // 3. Read proposal
  await assert("getProposal returns correct data", async () => {
    const p = await governance.getProposal(proposalId);
    if (p.description !== "Increase risk to 30%") throw new Error("Description mismatch");
    if (p.executed) throw new Error("Should not be executed yet");
    if (p.forVotes !== 0n) throw new Error("forVotes should be 0");
  });

  // 4. Voting is active
  await assert("isVotingActive returns true", async () => {
    const active = await governance.isVotingActive(proposalId);
    if (!active) throw new Error("Voting should be active");
  });

  // 5. Vote FOR
  await assert("deployer votes FOR proposal", async () => {
    const tx = await governance.vote(proposalId, true);
    const receipt = await waitTx(tx);
    const event = receipt.logs.find(l => l.fragment && l.fragment.name === "VoteCast");
    if (!event) throw new Error("VoteCast event not emitted");
    info(`  Vote weight: ${hre.ethers.formatEther(event.args[3])} CLAW`);
  });

  // 6. Double vote reverts
  await assertReverts("double vote reverts", async () => {
    await governance.vote(proposalId, true);
  });

  // 7. Verify vote recorded
  await assert("forVotes updated after vote", async () => {
    const p = await governance.getProposal(proposalId);
    if (p.forVotes === 0n) throw new Error("forVotes still 0");
  });

  // 8. hasVoted returns true
  await assert("hasVoted returns true for deployer", async () => {
    const voted = await governance.hasVoted(proposalId, deployer.address);
    if (!voted) throw new Error("hasVoted should be true");
  });

  // 9. Cannot execute before voting ends
  await assertReverts("executeProposal reverts before voting ends", async () => {
    await governance.executeProposal(proposalId);
  });

  // 10. Non-existent proposal reverts
  await assertReverts("vote on non-existent proposal reverts", async () => {
    await governance.vote(999, true);
  });

  // 11. Zero-balance voter reverts
  const noTokenWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  await assertReverts("zero-balance voter reverts", async () => {
    await governance.connect(noTokenWallet).vote(proposalId, false);
  });

  // 12. Proposal count check
  await assert("proposalCount is >= 1", async () => {
    const count = await governance.proposalCount();
    if (count < 1n) throw new Error(`proposalCount ${count} < 1`);
  });

  info("NOTE: executeProposal requires waiting 100 blocks — skipped in e2e to save time/gas");
}

module.exports = { run };
