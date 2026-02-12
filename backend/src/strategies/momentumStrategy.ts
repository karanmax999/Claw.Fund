import { IStrategy, TokenMarketData, TradeAction, TradeDecision, MomentumResult } from "../types";
import { config } from "../config";
import { log } from "../logger/reasoningLogger";

// ─── Scoring weights (must sum to 100) ───────────────────────────
const W_PRICE    = 40;
const W_VOLUME   = 30;
const W_LIQUIDITY = 30;

// ─── Thresholds ──────────────────────────────────────────────────
const BUY_THRESHOLD  = 75;
const SELL_THRESHOLD = 40;

// ─── Normalisation caps (raw metric → 0-1) ──────────────────────
const PRICE_CAP    = 0.30;   // 30 % price move → saturates at 1.0
const VOLUME_CAP   = 5.0;    // volume1m / volume5m ratio cap
const LIQUIDITY_CAP = 0.20;  // 20 % liquidity delta → saturates at 1.0

/**
 * Quantitative momentum strategy.
 *
 * For each token computes three normalised metrics and blends them
 * into a single 0–100 momentumScore:
 *
 *   priceChange5m   = (price - price5mAgo) / price5mAgo
 *   volumeSpikeRatio = volume1m / volume5m
 *   liquidityDelta   = (liquidity - previousLiquidity) / previousLiquidity
 *
 *   momentumScore = priceNorm * 40 + volumeNorm * 30 + liquidityNorm * 30
 *
 * Decision rules:
 *   score > 75 → BUY
 *   score < 40 → SELL
 *   else       → HOLD
 */
export class MomentumStrategy implements IStrategy {
  public readonly name = "MomentumStrategy";

  evaluate(tokens: TokenMarketData[]): TradeDecision[] {
    return tokens.map((md) => this.score(md));
  }

  // ─── Core scoring ────────────────────────────────────────────

  private score(md: TokenMarketData): TradeDecision {
    const { token, priceUsd, price5mAgo, volume1m, volume5m, liquidity, previousLiquidity } = md;

    // 1. Raw metrics (safe-divide to avoid NaN / Infinity)
    const priceChange5m    = safeDelta(priceUsd, price5mAgo);
    const volumeSpikeRatio = safeRatio(volume1m, volume5m);
    const liquidityDelta   = safeDelta(liquidity, previousLiquidity);

    // 2. Normalise each into 0–1
    const priceNorm     = normalise(priceChange5m, PRICE_CAP);
    const volumeNorm    = normalise(volumeSpikeRatio - 1, VOLUME_CAP - 1); // ratio of 1.0 = neutral
    const liquidityNorm = normalise(liquidityDelta, LIQUIDITY_CAP);

    // 3. Weighted composite → 0–100
    const raw = priceNorm * W_PRICE + volumeNorm * W_VOLUME + liquidityNorm * W_LIQUIDITY;
    const momentumScore = clamp(raw, 0, 100);

    // 4. Decision
    const result = this.decide(momentumScore);

    // 5. Build rich reasoning string
    const reasoning =
      `priceΔ5m=${(priceChange5m * 100).toFixed(2)}% (norm ${priceNorm.toFixed(3)}) | ` +
      `volSpike=${volumeSpikeRatio.toFixed(2)}x (norm ${volumeNorm.toFixed(3)}) | ` +
      `liqΔ=${(liquidityDelta * 100).toFixed(2)}% (norm ${liquidityNorm.toFixed(3)}) | ` +
      `score=${momentumScore.toFixed(1)} → ${result.action}`;

    log.debug(`[${this.name}] ${token.symbol}: ${reasoning}`);

    return {
      token,
      action: result.action,
      confidence: result.confidence,
      momentumScore: result.momentumScore,
      reason: reasoning,
      suggestedSize: result.action === TradeAction.HOLD ? 0 : config.POSITION_SIZE * result.confidence,
    };
  }

  private decide(momentumScore: number): MomentumResult {
    let action: TradeAction;
    let reasoning: string;

    if (momentumScore > BUY_THRESHOLD) {
      action = TradeAction.BUY;
      reasoning = `Score ${momentumScore.toFixed(1)} > ${BUY_THRESHOLD} → BUY`;
    } else if (momentumScore < SELL_THRESHOLD) {
      action = TradeAction.SELL;
      reasoning = `Score ${momentumScore.toFixed(1)} < ${SELL_THRESHOLD} → SELL`;
    } else {
      action = TradeAction.HOLD;
      reasoning = `Score ${momentumScore.toFixed(1)} in [${SELL_THRESHOLD},${BUY_THRESHOLD}] → HOLD`;
    }

    return {
      action,
      confidence: momentumScore / 100,
      momentumScore,
      reasoning,
    };
  }
}

// ─── Pure math helpers ───────────────────────────────────────────

/** (current - previous) / previous, returns 0 when previous ≈ 0. */
function safeDelta(current: number, previous: number): number {
  if (Math.abs(previous) < 1e-12) return 0;
  return (current - previous) / previous;
}

/** current / previous, returns 1 when previous ≈ 0 (neutral ratio). */
function safeRatio(current: number, previous: number): number {
  if (Math.abs(previous) < 1e-12) return 1;
  return current / previous;
}

/** Map a signed value into 0–1 using a symmetric cap.
 *  -cap → 0,  0 → 0.5,  +cap → 1 */
function normalise(value: number, cap: number): number {
  const clamped = clamp(value, -cap, cap);
  return (clamped + cap) / (2 * cap);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
