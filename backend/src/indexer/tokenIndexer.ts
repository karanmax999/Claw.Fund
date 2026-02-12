import { Token, TokenMarketData } from "../types";
import { log } from "../logger/reasoningLogger";

/**
 * Mock Nad.fun token data fetcher with in-memory rolling cache.
 *
 * Each tick the indexer:
 *   1. Generates a new spot price (random walk around base).
 *   2. Shifts the previous 1 m price → 5 m slot; current → 1 m slot.
 *   3. Generates mock volume / liquidity with the same shift logic.
 *
 * Replace the random generators with real API calls when ready.
 * No external database — everything lives in `cacheByAddress`.
 */

// ─── Deterministic helpers ───────────────────────────────────────

function jitter(base: number, pct: number): number {
  return base * (1 + (Math.random() - 0.5) * pct);
}

function clampPositive(n: number): number {
  return Math.max(n, 0);
}

// ─── Static token definitions ────────────────────────────────────

const TOKEN_DEFS: { token: Token; basePrice: number; baseVolume: number; baseLiquidity: number }[] = [
  {
    token: {
      address: "0xNAD_TOKEN_ALPHA",
      symbol: "ALPHA",
      name: "Alpha Token",
      decimals: 18,
      totalSupply: 1_000_000,
      createdAt: new Date("2025-12-01"),
    },
    basePrice: 0.42,
    baseVolume: 2_100,
    baseLiquidity: 420_000,
  },
  {
    token: {
      address: "0xNAD_TOKEN_BETA",
      symbol: "BETA",
      name: "Beta Token",
      decimals: 18,
      totalSupply: 5_000_000,
      createdAt: new Date("2026-01-15"),
    },
    basePrice: 0.087,
    baseVolume: 970,
    baseLiquidity: 435_000,
  },
  {
    token: {
      address: "0xNAD_TOKEN_GAMMA",
      symbol: "GAMMA",
      name: "Gamma Token",
      decimals: 18,
      totalSupply: 10_000_000,
      createdAt: new Date("2026-02-01"),
    },
    basePrice: 0.015,
    baseVolume: 210,
    baseLiquidity: 150_000,
  },
];

// ─── In-memory rolling cache ─────────────────────────────────────

interface CacheEntry {
  priceUsd: number;
  price1mAgo: number;
  price5mAgo: number;
  volume1m: number;
  volume5m: number;
  liquidity: number;
  previousLiquidity: number;
}

const cacheByAddress = new Map<string, CacheEntry>();

function initCacheEntry(basePrice: number, baseVolume: number, baseLiquidity: number): CacheEntry {
  return {
    priceUsd: basePrice,
    price1mAgo: basePrice,
    price5mAgo: basePrice,
    volume1m: baseVolume,
    volume5m: baseVolume,
    liquidity: baseLiquidity,
    previousLiquidity: baseLiquidity,
  };
}

function advanceCache(
  entry: CacheEntry,
  basePrice: number,
  baseVolume: number,
  baseLiquidity: number,
): CacheEntry {
  // Shift rolling windows: current → 1m, 1m → 5m
  const newPrice = clampPositive(jitter(entry.priceUsd, 0.10));
  const newVolume = clampPositive(jitter(baseVolume, 0.40));
  const newLiquidity = clampPositive(jitter(baseLiquidity, 0.08));

  return {
    price5mAgo: entry.price1mAgo,
    price1mAgo: entry.priceUsd,
    priceUsd: newPrice,
    volume5m: entry.volume1m,
    volume1m: newVolume,
    previousLiquidity: entry.liquidity,
    liquidity: newLiquidity,
  };
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Fetch enriched market data for all tracked tokens.
 * Each call advances the rolling cache by one tick.
 */
export async function fetchTokens(): Promise<TokenMarketData[]> {
  log.debug(`[TokenIndexer] Fetching ${TOKEN_DEFS.length} tokens…`);

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 70));

  const now = Date.now();
  const results: TokenMarketData[] = [];

  for (const def of TOKEN_DEFS) {
    const addr = def.token.address;

    // Initialise on first tick
    if (!cacheByAddress.has(addr)) {
      cacheByAddress.set(addr, initCacheEntry(def.basePrice, def.baseVolume, def.baseLiquidity));
    }

    // Advance the cache
    const prev = cacheByAddress.get(addr)!;
    const next = advanceCache(prev, def.basePrice, def.baseVolume, def.baseLiquidity);
    cacheByAddress.set(addr, next);

    results.push({
      token: def.token,
      priceUsd: next.priceUsd,
      price1mAgo: next.price1mAgo,
      price5mAgo: next.price5mAgo,
      volume1m: next.volume1m,
      volume5m: next.volume5m,
      liquidity: next.liquidity,
      previousLiquidity: next.previousLiquidity,
      updatedAt: now,
    });
  }

  log.debug(
    `[TokenIndexer] Fetched: ${results.map((r) => `${r.token.symbol}@$${r.priceUsd.toFixed(4)}`).join(", ")}`,
  );
  return results;
}
