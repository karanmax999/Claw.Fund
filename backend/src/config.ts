import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function envOrDefault(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envRequiredOrDefault(key: string, fallback: string): string {
  const val = process.env[key];
  if (val === undefined || val === "") return fallback;
  return val;
}

export const config = {
  /** When true, no real transactions are broadcast. */
  DRY_RUN: envOrDefault("DRY_RUN", "true") === "true",

  /** Milliseconds between each agent loop iteration. */
  POLL_INTERVAL_MS: parseInt(envOrDefault("POLL_INTERVAL_MS", "10000"), 10),

  /** Momentum strategy: minimum % change to trigger a signal. */
  MOMENTUM_THRESHOLD: parseFloat(envOrDefault("MOMENTUM_THRESHOLD", "5.0")),

  /** Default position size as a fraction of portfolio. */
  POSITION_SIZE: parseFloat(envOrDefault("POSITION_SIZE", "0.1")),

  /** Mock wallet address. */
  WALLET_ADDRESS: envRequiredOrDefault("WALLET_ADDRESS", "0xMOCK_WALLET_ADDRESS"),

  /** Mock private key (never use a real key in env without a vault). */
  PRIVATE_KEY: envRequiredOrDefault("PRIVATE_KEY", "0xMOCK_PRIVATE_KEY"),

  /** Logging level. */
  LOG_LEVEL: envOrDefault("LOG_LEVEL", "debug") as "debug" | "info" | "warn" | "error",

  /** Directory for reasoning log files. */
  LOG_DIR: envOrDefault("LOG_DIR", "./logs"),
} as const;

export const RISK_CONFIG = {
  /** Max fraction of portfolio allocated to a single token. */
  maxAllocationPerToken: 0.15,
  /** Max total portfolio exposure across all positions. */
  maxTotalExposure: 0.6,
  /** Minimum USD liquidity required to trade a token. */
  minLiquidityUsd: 100_000,
  /** Cooldown period (minutes) between trades on the same token. */
  cooldownMinutes: 5,
} as const;
