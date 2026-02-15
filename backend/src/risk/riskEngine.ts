import { RISK_CONFIG } from "../config";
import { log } from "../logger/reasoningLogger";
import { TokenMarketData, TradeDecision, PortfolioState, RiskResult } from "../types";

/**
 * Deterministic risk gate.
 *
 * Evaluates a proposed trade decision against four hard rules:
 *   1. Per-token allocation cap
 *   2. Total portfolio exposure cap
 *   3. Minimum liquidity floor
 *   4. Per-token cooldown timer
 *
 * Returns { pass: true } if all rules pass, or { pass: false, reason }
 * with the first violated rule.
 */
export function evaluateRisk(
  token: TokenMarketData,
  decision: TradeDecision,
  portfolioState: PortfolioState,
): RiskResult {
  const addr = token.token.address;
  const symbol = token.token.symbol;
  const alloc = decision.suggestedSize;

  // Rule 1 — per-token allocation cap
  if (alloc > RISK_CONFIG.maxAllocationPerToken) {
    const reason =
      `[RISK] ${symbol}: allocation ${(alloc * 100).toFixed(1)}% > ` +
      `max ${(RISK_CONFIG.maxAllocationPerToken * 100).toFixed(0)}% per token`;
    log.warn(reason);
    return { pass: false, reason };
  }

  // Rule 2 — total portfolio exposure cap
  const projectedExposure = portfolioState.totalExposure + alloc;
  if (projectedExposure > RISK_CONFIG.maxTotalExposure) {
    const reason =
      `[RISK] ${symbol}: projected exposure ${(projectedExposure * 100).toFixed(1)}% > ` +
      `max ${(RISK_CONFIG.maxTotalExposure * 100).toFixed(0)}%`;
    log.warn(reason);
    return { pass: false, reason };
  }

  // Rule 3 — minimum liquidity floor
  if (token.liquidity < RISK_CONFIG.minLiquidityUsd) {
    const reason =
      `[RISK] ${symbol}: liquidity $${token.liquidity.toFixed(0)} < ` +
      `min $${RISK_CONFIG.minLiquidityUsd.toLocaleString()}`;
    log.warn(reason);
    return { pass: false, reason };
  }

  // Rule 4 — cooldown timer
  const lastTrade = portfolioState.lastTradeTimestamps[addr];
  if (lastTrade !== undefined) {
    const elapsedMs = Date.now() - lastTrade;
    const cooldownMs = RISK_CONFIG.cooldownMinutes * 60_000;
    if (elapsedMs < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1_000);
      const reason =
        `[RISK] ${symbol}: cooldown active — ${remainingSec}s remaining ` +
        `(min ${RISK_CONFIG.cooldownMinutes}m between trades)`;
      log.warn(reason);
      return { pass: false, reason };
    }
  }

  log.debug(`[RISK] ${symbol}: all checks passed (alloc=${(alloc * 100).toFixed(1)}%)`);
  return { pass: true };
}
