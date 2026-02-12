// ─── Base Token Identity ──────────────────────────────────────────

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: number;
  createdAt: Date;
}

// ─── Rolling-Window Market Data ───────────────────────────────────

/** Live market data enriched with rolling-window fields by the indexer. */
export interface TokenMarketData {
  token: Token;
  priceUsd: number;
  price1mAgo: number;
  price5mAgo: number;
  volume1m: number;
  volume5m: number;
  liquidity: number;
  previousLiquidity: number;
  updatedAt: number;          // epoch ms
}

// ─── Trade Enums & Decisions ──────────────────────────────────────

export enum TradeAction {
  BUY = "BUY",
  SELL = "SELL",
  HOLD = "HOLD",
}

/** Output of a momentum strategy evaluation for a single token. */
export interface MomentumResult {
  action: TradeAction;
  confidence: number;         // 0–1
  momentumScore: number;      // 0–100
  reasoning: string;
}

/** Full trade decision enriched with momentum data. */
export interface TradeDecision {
  token: Token;
  action: TradeAction;
  confidence: number;         // 0–1
  momentumScore: number;      // 0–100
  reason: string;
  suggestedSize: number;      // fraction of portfolio (0–1)
}

// ─── Execution ────────────────────────────────────────────────────

/** Raw result returned by the execution engine for a single trade. */
export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  gasEstimate?: number;
  error?: string;
}

export interface TradeExecution {
  id: string;
  decision: TradeDecision;
  executedAt: Date;
  txHash: string | null;
  success: boolean;
  error?: string;
}

// ─── Reasoning Log ────────────────────────────────────────────────

export interface ReasoningEntry {
  runId: string;
  timestamp: Date;
  tokensEvaluated: number;
  decisions: TradeDecision[];
  executions: TradeExecution[];
  dryRun: boolean;
}

// ─── Portfolio & Risk ────────────────────────────────────────────

/** In-memory portfolio state passed into the risk engine each tick. */
export interface PortfolioState {
  totalExposure: number;
  allocations: Record<string, number>;
  lastTradeTimestamps: Record<string, number>;
}

/** Result of a single risk evaluation. */
export interface RiskResult {
  pass: boolean;
  reason?: string;
}

// ─── Interfaces ───────────────────────────────────────────────────

/** Strategy interface — all strategies must implement this. */
export interface IStrategy {
  name: string;
  evaluate(tokens: TokenMarketData[]): TradeDecision[];
}

/** Signer interface — abstracts wallet signing. */
export interface ISigner {
  address: string;
  signTransaction(tx: UnsignedTransaction): Promise<string>;
}

export interface UnsignedTransaction {
  to: string;
  value: string;
  data: string;
}
