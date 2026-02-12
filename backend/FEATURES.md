# 🦀 Claw.Fund — Feature Documentation

Complete feature breakdown of the autonomous trading agent backend.

---

## 📋 Table of Contents

- [Core Agent Loop](#-core-agent-loop)
- [Token Indexer](#-token-indexer)
- [Momentum Strategy](#-momentum-strategy)
- [Decision Engine](#-decision-engine)
- [Risk Engine](#-risk-engine)
- [Execution Engine](#-execution-engine)
- [WebSocket Broadcasting](#-websocket-broadcasting)
- [SQLite Persistent Storage](#-sqlite-persistent-storage)
- [Reasoning Logger](#-reasoning-logger)
- [Configuration System](#-configuration-system)
- [USDC Transfer Utility](#-usdc-transfer-utility)

---

## 🔄 Core Agent Loop

**File:** `src/agent/agentLoop.ts`

The central orchestrator that runs an infinite loop at a configurable interval.

**Pipeline per tick:**
1. Fetch rolling-window market data from the indexer
2. Run all strategies via the decision engine (with risk gating)
3. Broadcast `DECISION` events via WebSocket
4. Persist decisions to SQLite
5. Execute actionable trades (BUY/SELL) through the execution engine
6. Update in-memory portfolio state (allocations, exposure, cooldowns)
7. Broadcast `TRADE_EXECUTED` and `PORTFOLIO_UPDATE` events
8. Persist executions to SQLite
9. Write full reasoning log to JSON file

**Key details:**
- Portfolio state persists across ticks in memory
- Exposure is recomputed after every execution cycle
- All errors are caught and logged without crashing the loop
- Supports `DRY_RUN` mode for safe testing

---

## 📊 Token Indexer

**File:** `src/indexer/tokenIndexer.ts`

Maintains an in-memory rolling cache of market data for each tracked token.

**Features:**
- Tracks 3 mock tokens: ALPHA, BETA, GAMMA
- Rolling-window fields per token:
  - `priceUsd` — current price
  - `price1mAgo` — price 1 minute ago
  - `price5mAgo` — price 5 minutes ago
  - `volume1m` — volume in the last 1 minute
  - `volume5m` — volume in the last 5 minutes
  - `liquidity` — current USD liquidity
  - `previousLiquidity` — liquidity from prior tick
- Previous values shift automatically each tick
- No external database required — fully in-memory

---

## 📈 Momentum Strategy

**File:** `src/strategies/momentumStrategy.ts`

Quantitative scoring strategy that evaluates each token on three weighted metrics.

**Metrics:**
| Metric | Weight | Formula |
|---|---|---|
| Price Change (5m) | 40% | `(price - price5mAgo) / price5mAgo` |
| Volume Spike Ratio | 30% | `volume1m / volume5m` |
| Liquidity Delta | 30% | `(liquidity - previousLiquidity) / previousLiquidity` |

**Scoring:**
- Each metric is normalized to a 0–1 range
- Composite score: `(priceNorm * 40) + (volNorm * 30) + (liqNorm * 30)`
- Final score is clamped between 0–100

**Decision rules:**
| Momentum Score | Action |
|---|---|
| > 75 | **BUY** |
| < 40 | **SELL** |
| 40–75 | **HOLD** |

**Output per token:**
- `action` — BUY / SELL / HOLD
- `confidence` — momentumScore / 100
- `momentumScore` — 0–100
- `reason` — human-readable breakdown of all metrics

---

## 🧠 Decision Engine

**File:** `src/engine/decisionEngine.ts`

Orchestrates strategy evaluation and risk gating. Strategy-agnostic — accepts any `IStrategy` implementation.

**Features:**
- Runs all registered strategies against market data
- Passes each non-HOLD decision through the risk engine
- Decisions that fail risk checks are downgraded to HOLD
- Risk failure reason is appended to the decision's reasoning string
- Logs full strategy output including momentum score and confidence

**Separation of concerns:**
- Decision Engine decides **what** to trade
- Risk Engine gates **whether** to trade
- Execution Engine handles **how** to trade

---

## 🛡 Risk Engine

**File:** `src/risk/riskEngine.ts`

Deterministic risk gate that evaluates proposed trades against four hard rules.

**Risk Rules:**

| # | Rule | Threshold | Behavior |
|---|---|---|---|
| 1 | Per-token allocation cap | 15% of portfolio | Blocks if `suggestedSize > 0.15` |
| 2 | Total exposure cap | 60% of portfolio | Blocks if `totalExposure + size > 0.60` |
| 3 | Minimum liquidity floor | $100,000 USD | Blocks if `token.liquidity < 100000` |
| 4 | Per-token cooldown | 5 minutes | Blocks if last trade on same token was < 5m ago |

**Behavior:**
- Returns `{ pass: true }` if all rules pass
- Returns `{ pass: false, reason: "..." }` on the first violated rule
- Violations are logged at WARN level
- No probabilistic logic — fully deterministic

**Configuration:** `RISK_CONFIG` in `src/config.ts`

---

## ⚡ Execution Engine

**File:** `src/execution/executionEngine.ts`

Dedicated trade execution layer, separated from the decision engine.

**Features:**
- `executeTrade(decision)` → `Promise<ExecutionResult>`
- HOLD decisions return `{ success: false }` (not executable)
- Simulates gas estimate (random 0.001–0.005)
- Generates mock 32-byte transaction hash
- Respects `DRY_RUN` flag with `[DRY_RUN]` log suffix
- Live path includes simulated broadcast latency

**Log format:**
```
EXECUTION | BUY ALPHA | size=0.1200 | conf=0.85 | momentum=78.3 | gas=0.0032 | tx=0xabc... [DRY_RUN]
```

**Return type:**
```typescript
{
  success: boolean;
  txHash?: string;
  gasEstimate?: number;
  error?: string;
}
```

---

## 📡 WebSocket Broadcasting

**File:** `src/ws/wsServer.ts`

Real-time event streaming for frontend dashboards.

**Features:**
- WebSocket server on port 8080
- Singleton pattern — safe to call `startWsServer()` multiple times
- Broadcasts JSON events to all connected clients
- Tracks client connect/disconnect with count logging
- Silently skips clients not in OPEN state

**Event types:**

| Event | Trigger | Key Fields |
|---|---|---|
| `DECISION` | After strategy + risk evaluation | `decisions[]`, `timestamp` |
| `TRADE_EXECUTED` | After each successful trade | `token`, `action`, `allocation`, `txHash`, `timestamp` |
| `PORTFOLIO_UPDATE` | After portfolio recompute | `portfolioState`, `timestamp` |

**Connect:** `ws://localhost:8080`

---

## 💾 SQLite Persistent Storage

**File:** `src/db/database.ts`

Persistent storage for trade decisions and executions using SQLite.

**Features:**
- Database file: `claw.db` (auto-created at project root)
- WAL mode enabled for concurrent read performance
- Prepared statements for efficient inserts
- Error-safe — logs failures without crashing the agent

**Tables:**

### `decisions`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER (PK) | Auto-increment |
| `token` | TEXT | Token symbol |
| `action` | TEXT | BUY / SELL / HOLD |
| `allocation` | REAL | Suggested position size |
| `confidence` | REAL | 0–1 confidence score |
| `momentumScore` | REAL | 0–100 momentum score |
| `reasoning` | TEXT | Human-readable reasoning |
| `timestamp` | INTEGER | Unix epoch (ms) |

### `executions`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER (PK) | Auto-increment |
| `token` | TEXT | Token symbol |
| `action` | TEXT | BUY / SELL |
| `txHash` | TEXT | Transaction hash |
| `allocation` | REAL | Executed position size |
| `confidence` | REAL | 0–1 confidence score |
| `momentumScore` | REAL | 0–100 momentum score |
| `timestamp` | INTEGER | Unix epoch (ms) |

**Exported functions:**
- `saveDecision(decision: TradeDecision)` — persists after strategy evaluation
- `saveExecution(execution: TradeExecution)` — persists after successful trade

---

## 📝 Reasoning Logger

**File:** `src/logger/reasoningLogger.ts`

Dual-purpose logging system.

**Features:**
- **Console logger** — timestamped, leveled output (debug, info, warn, error)
- **JSON persistence** — full reasoning entry saved to `logs/<runId>.json` after each tick
- Configurable log level and directory via `.env`

**Reasoning entry contains:**
- `runId` — unique tick identifier
- `timestamp` — ISO date
- `tokensEvaluated` — count of tokens processed
- `decisions[]` — all trade decisions with scores and reasoning
- `executions[]` — all trade executions with tx hashes
- `dryRun` — whether DRY_RUN was active

---

## ⚙️ Configuration System

**File:** `src/config.ts`

Centralized environment variable loading with sensible defaults.

**Environment variables:**
- `DRY_RUN` — toggle live/dry execution
- `POLL_INTERVAL_MS` — agent loop frequency
- `MOMENTUM_THRESHOLD` — strategy sensitivity
- `POSITION_SIZE` — default trade size
- `WALLET_ADDRESS` / `PRIVATE_KEY` — wallet credentials
- `LOG_LEVEL` / `LOG_DIR` — logging config

**Risk config (hardcoded):**
```typescript
export const RISK_CONFIG = {
  maxAllocationPerToken: 0.15,
  maxTotalExposure: 0.6,
  minLiquidityUsd: 100_000,
  cooldownMinutes: 5,
} as const;
```

---

## 💸 USDC Transfer Utility

**File:** `scripts/sendUSDC.js`

Standalone script for sending USDC on Base network.

**Features:**
- Checks USDC balance on Base mainnet
- Checks ETH balance for gas
- Validates sufficient funds before sending
- Sends specified USDC amount via ERC-20 `transfer()`
- Prints BaseScan link on confirmation

**Usage:**
```bash
node scripts/sendUSDC.js
```

**Configuration via `.env`:**
- `PRIVATE_KEY` — wallet private key
- `RECIPIENT_ADDRESS` — destination address

**Network details:**
- Chain: Base (mainnet)
- USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- RPC: `https://mainnet.base.org`

---

## 🔒 Type System

**File:** `src/types/index.ts`

Comprehensive TypeScript interfaces for the entire system.

**Core types:**
- `Token` — base token identity (address, symbol, name, decimals)
- `TokenMarketData` — enriched with rolling-window fields
- `TradeAction` — enum: BUY, SELL, HOLD
- `TradeDecision` — full decision with momentum score, confidence, reasoning
- `ExecutionResult` — raw execution output (success, txHash, gasEstimate)
- `TradeExecution` — enriched execution record
- `PortfolioState` — in-memory portfolio (exposure, allocations, cooldowns)
- `RiskResult` — risk evaluation output (pass/fail + reason)
- `ReasoningEntry` — full tick audit log
- `IStrategy` — pluggable strategy interface
- `ISigner` — wallet signing abstraction
