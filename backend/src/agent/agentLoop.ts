import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { log, persistReasoning } from "../logger/reasoningLogger";
import { fetchTokens } from "../indexer/tokenIndexer";
import { DecisionEngine } from "../engine/decisionEngine";
import { MomentumStrategy } from "../strategies/momentumStrategy";
import { executeTrade } from "../execution/executionEngine";
import { broadcast, WsEventType } from "../ws/wsServer";
import { saveDecision, saveExecution } from "../db/database";
import {
  ReasoningEntry, PortfolioState, TradeAction,
  TradeDecision, TradeExecution,
} from "../types";

/**
 * Core agent loop: monitor → think → risk-gate → execute → broadcast → log.
 * Runs indefinitely at the configured poll interval.
 */
export async function startAgentLoop(): Promise<void> {
  const strategy = new MomentumStrategy();
  const engine = new DecisionEngine([strategy]);

  // In-memory portfolio state — persists across ticks
  const portfolioState: PortfolioState = {
    totalExposure: 0,
    allocations: {},
    lastTradeTimestamps: {},
  };

  log.info("═══════════════════════════════════════════");
  log.info("  Claw.Fund Autonomous Agent Starting…");
  log.info(`  DRY_RUN       : ${config.DRY_RUN}`);
  log.info(`  Poll Interval : ${config.POLL_INTERVAL_MS}ms`);
  log.info(`  Wallet        : ${config.WALLET_ADDRESS}`);
  log.info("═══════════════════════════════════════════");

  const tick = async (): Promise<void> => {
    const runId = uuidv4();
    log.info(`\n── Tick ${runId} ──────────────────────`);

    try {
      // 1. MONITOR — fetch latest market data (rolling-window enriched)
      const marketData = await fetchTokens();
      log.info(`Fetched ${marketData.length} tokens with rolling-window data`);

      // 2. THINK — run decision engine (strategies + risk gate)
      const decisions = engine.evaluate(marketData, portfolioState);
      log.info(`Produced ${decisions.length} decisions`);

      // Broadcast DECISION event
      broadcast({
        type: WsEventType.DECISION,
        decisions: decisions.map((d) => ({
          token: d.token.symbol,
          action: d.action,
          confidence: d.confidence,
          momentumScore: d.momentumScore,
          allocation: d.suggestedSize,
          reason: d.reason,
        })),
        timestamp: Date.now(),
      });

      // Persist decisions to SQLite
      for (const d of decisions) {
        saveDecision(d);
      }

      // 3. EXECUTE — send actionable decisions through the execution engine
      const actionable = decisions.filter((d) => d.action !== TradeAction.HOLD);
      const executions: TradeExecution[] = [];

      if (actionable.length === 0) {
        log.info("No actionable decisions — all HOLD.");
      }

      for (const decision of actionable) {
        const result = await executeTrade(decision);
        const execution: TradeExecution = {
          id: uuidv4(),
          decision,
          executedAt: new Date(),
          txHash: result.txHash ?? null,
          success: result.success,
          error: result.error,
        };
        executions.push(execution);

        // 4. UPDATE PORTFOLIO STATE on success
        if (result.success) {
          const addr = decision.token.address;
          const size = decision.suggestedSize;

          if (decision.action === TradeAction.BUY) {
            portfolioState.allocations[addr] =
              (portfolioState.allocations[addr] ?? 0) + size;
          } else if (decision.action === TradeAction.SELL) {
            portfolioState.allocations[addr] =
              Math.max((portfolioState.allocations[addr] ?? 0) - size, 0);
          }

          portfolioState.lastTradeTimestamps[addr] = Date.now();

          // Broadcast TRADE_EXECUTED event
          broadcast({
            type: WsEventType.TRADE_EXECUTED,
            runId,
            token: decision.token.symbol,
            action: decision.action,
            allocation: decision.suggestedSize,
            confidence: decision.confidence,
            momentumScore: decision.momentumScore,
            txHash: result.txHash ?? null,
            timestamp: Date.now(),
          });

          // Persist execution to SQLite
          saveExecution(execution);
        }
      }

      log.info(`Executed ${executions.length} trade(s)`);

      // Recompute total exposure from allocations
      portfolioState.totalExposure = Object.values(portfolioState.allocations)
        .reduce((sum, v) => sum + v, 0);

      const activePositions = Object.keys(portfolioState.allocations)
        .filter((k) => portfolioState.allocations[k] > 0);

      log.info(
        `Portfolio: exposure=${(portfolioState.totalExposure * 100).toFixed(1)}%, ` +
        `positions=${activePositions.length}`,
      );

      // Broadcast PORTFOLIO_UPDATE event
      broadcast({
        type: WsEventType.PORTFOLIO_UPDATE,
        portfolioState: {
          totalExposure: portfolioState.totalExposure,
          allocations: { ...portfolioState.allocations },
          positions: activePositions.length,
        },
        timestamp: Date.now(),
      });

      // 5. LOG — persist reasoning for auditability
      const entry: ReasoningEntry = {
        runId,
        timestamp: new Date(),
        tokensEvaluated: marketData.length,
        decisions,
        executions,
        dryRun: config.DRY_RUN,
      };
      persistReasoning(entry);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`Agent loop error: ${msg}`);
    }
  };

  // Initial tick
  await tick();

  // Recurring ticks
  setInterval(tick, config.POLL_INTERVAL_MS);
}
