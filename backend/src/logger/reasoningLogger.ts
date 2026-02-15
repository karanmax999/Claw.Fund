import * as fs from "fs";
import * as path from "path";
import { config } from "../config";
import { ReasoningEntry } from "../types";

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

function shouldLog(level: keyof typeof LOG_LEVELS): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.LOG_LEVEL];
}

function timestamp(): string {
  return new Date().toISOString();
}

function ensureLogDir(): void {
  const dir = path.resolve(config.LOG_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Console logger with level filtering. */
export const log = {
  debug: (msg: string, meta?: unknown) => {
    if (shouldLog("debug")) console.log(`[${timestamp()}] [DEBUG] ${msg}`, meta ?? "");
  },
  info: (msg: string, meta?: unknown) => {
    if (shouldLog("info")) console.log(`[${timestamp()}] [INFO]  ${msg}`, meta ?? "");
  },
  warn: (msg: string, meta?: unknown) => {
    if (shouldLog("warn")) console.warn(`[${timestamp()}] [WARN]  ${msg}`, meta ?? "");
  },
  error: (msg: string, meta?: unknown) => {
    if (shouldLog("error")) console.error(`[${timestamp()}] [ERROR] ${msg}`, meta ?? "");
  },
};

/** Persist a full reasoning entry to disk as a JSON file. */
export function persistReasoning(entry: ReasoningEntry): void {
  ensureLogDir();
  const filename = `${entry.runId}.json`;
  const filepath = path.resolve(config.LOG_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(entry, null, 2), "utf-8");
  log.info(`Reasoning log persisted → ${filepath}`);
}
