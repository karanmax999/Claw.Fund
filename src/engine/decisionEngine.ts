import { log } from "../logger/reasoningLogger";
import {
  TokenMarketData, TradeAction, TradeDecision,
  IStrategy, PortfolioState,
} from "../types";
import { evaluateRisk } from "../risk/riskEngine";

/**
 * DecisionEngine orchestrates strategy evaluation and risk gating.
 * Execution is handled downstream by the ExecutionEngine.
 */
export class DecisionEngine {
  private readonly strategies: IStrategy[];

  constructor(strategies: IStrategy[]) {
    this.strategies = strategies;
    log.info(`DecisionEngine initialised with ${strategies.length} strategy(ies)`);
  }

  /**
   * Run all strategies against the provided market data, then gate
   * each actionable decision through the risk engine.
   * Decisions that fail risk checks are downgraded to HOLD.
   */
  evaluate(tokens: TokenMarketData[], portfolioState: PortfolioState): TradeDecision[] {
    const tokenByAddress = new Map(tokens.map((t) => [t.token.address, t]));
    const allDecisions: TradeDecision[] = [];

    for (const strategy of this.strategies) {
      log.debug(`Running strategy: ${strategy.name}`);
      const decisions = strategy.evaluate(tokens);

      for (const d of decisions) {
        log.info(
          `[${strategy.name}] ${d.token.symbol} → ${d.action} | ` +
          `score=${d.momentumScore.toFixed(1)} conf=${d.confidence.toFixed(2)} | ${d.reason}`,
        );
      }

      // Risk-gate each non-HOLD decision
      const gated = decisions.map((d) => {
        if (d.action === TradeAction.HOLD) return d;

        const md = tokenByAddress.get(d.token.address);
        if (!md) return d;

        const riskResult = evaluateRisk(md, d, portfolioState);
        if (!riskResult.pass) {
          log.info(`[RiskGate] ${d.token.symbol} ${d.action} → HOLD | ${riskResult.reason}`);
          return {
            ...d,
            action: TradeAction.HOLD,
            suggestedSize: 0,
            reason: `${d.reason} || RISK BLOCKED: ${riskResult.reason}`,
          };
        }
        return d;
      });

      allDecisions.push(...gated);
    }

    return allDecisions;
  }
}
