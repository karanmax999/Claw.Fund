import { config } from "../config";
import { log } from "../logger/reasoningLogger";
import { TradeAction, TradeDecision, ExecutionResult } from "../types";

/**
 * Execution Engine (V1 — mock).
 *
 * Responsible for the final step of the pipeline: turning a TradeDecision
 * into an on-chain transaction. In this mock version it simulates gas
 * estimation, generates a fake txHash, and returns success.
 *
 * Replace internals with real RPC / signer calls when blockchain
 * integration is ready. The interface stays the same.
 */
export async function executeTrade(decision: TradeDecision): Promise<ExecutionResult> {
  const { token, action, suggestedSize, confidence, momentumScore } = decision;

  // HOLD decisions are not executable
  if (action === TradeAction.HOLD) {
    return { success: false, error: "HOLD is not an executable action" };
  }

  // DRY_RUN guard
  if (config.DRY_RUN) {
    const gasEstimate = simulateGas();
    const txHash = mockTxHash();

    log.info(
      `EXECUTION | ${action} ${token.symbol} | ` +
      `size=${suggestedSize.toFixed(4)} | ` +
      `conf=${confidence.toFixed(2)} | ` +
      `momentum=${momentumScore.toFixed(1)} | ` +
      `gas=${gasEstimate.toFixed(4)} | ` +
      `tx=${txHash} [DRY_RUN]`,
    );

    return { success: true, txHash, gasEstimate };
  }

  // Live execution path (mock for now)
  try {
    const gasEstimate = simulateGas();
    const txHash = mockTxHash();

    // Simulate broadcast latency
    await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 60));

    log.info(
      `EXECUTION | ${action} ${token.symbol} | ` +
      `size=${suggestedSize.toFixed(4)} | ` +
      `conf=${confidence.toFixed(2)} | ` +
      `momentum=${momentumScore.toFixed(1)} | ` +
      `gas=${gasEstimate.toFixed(4)} | ` +
      `tx=${txHash}`,
    );

    return { success: true, txHash, gasEstimate };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    log.error(`EXECUTION FAILED | ${action} ${token.symbol} | ${error}`);
    return { success: false, error };
  }
}

// ─── Mock helpers ────────────────────────────────────────────────

/** Simulate gas estimate between 0.001 and 0.005. */
function simulateGas(): number {
  return 0.001 + Math.random() * 0.004;
}

/** Generate a deterministic-looking fake tx hash. */
function mockTxHash(): string {
  const hex = (n: number) => Math.floor(Math.random() * n).toString(16).padStart(8, "0");
  return `0x${hex(0xffffffff)}${hex(0xffffffff)}${hex(0xffffffff)}${hex(0xffffffff)}`;
}
