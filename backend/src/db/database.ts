import Database from "better-sqlite3";
import path from "path";
import { log } from "../logger/reasoningLogger";
import { TradeDecision, TradeExecution } from "../types";

// ─── Initialize SQLite ──────────────────────────────────────────

const DB_PATH = path.resolve(process.cwd(), "claw.db");
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

log.info(`[DB] SQLite database initialised at ${DB_PATH}`);

// ─── Create tables ──────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    action TEXT NOT NULL,
    allocation REAL NOT NULL,
    confidence REAL NOT NULL,
    momentumScore REAL NOT NULL,
    reasoning TEXT,
    timestamp INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    action TEXT NOT NULL,
    txHash TEXT,
    allocation REAL NOT NULL,
    confidence REAL NOT NULL,
    momentumScore REAL NOT NULL,
    timestamp INTEGER NOT NULL
  );
`);

log.info("[DB] Tables ready (decisions, executions)");

// ─── Prepared statements ────────────────────────────────────────

const insertDecision = db.prepare(`
  INSERT INTO decisions (token, action, allocation, confidence, momentumScore, reasoning, timestamp)
  VALUES (@token, @action, @allocation, @confidence, @momentumScore, @reasoning, @timestamp)
`);

const insertExecution = db.prepare(`
  INSERT INTO executions (token, action, txHash, allocation, confidence, momentumScore, timestamp)
  VALUES (@token, @action, @txHash, @allocation, @confidence, @momentumScore, @timestamp)
`);

// ─── Public API ─────────────────────────────────────────────────

/** Persist a single trade decision to SQLite. */
export function saveDecision(decision: TradeDecision): void {
  try {
    insertDecision.run({
      token: decision.token.symbol,
      action: decision.action,
      allocation: decision.suggestedSize,
      confidence: decision.confidence,
      momentumScore: decision.momentumScore,
      reasoning: decision.reason,
      timestamp: Date.now(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`[DB] Failed to save decision: ${msg}`);
  }
}

/** Persist a single trade execution to SQLite. */
export function saveExecution(execution: TradeExecution): void {
  try {
    insertExecution.run({
      token: execution.decision.token.symbol,
      action: execution.decision.action,
      txHash: execution.txHash ?? null,
      allocation: execution.decision.suggestedSize,
      confidence: execution.decision.confidence,
      momentumScore: execution.decision.momentumScore,
      timestamp: Date.now(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`[DB] Failed to save execution: ${msg}`);
  }
}
