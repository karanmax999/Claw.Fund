# 🦀 Claw.Fund

**Autonomous Trading Agent** — AI-powered token trading with real-time momentum scoring, deterministic risk management, and WebSocket broadcasting.

Claw.Fund is a modular, production-grade TypeScript backend that monitors token markets, scores momentum signals, gates trades through a risk engine, executes via a dedicated execution layer, and streams every decision to connected frontends in real time.

---

## 🏗 Project Structure

```
claw-fund/
├── src/
│   ├── index.ts                  # Entrypoint — boots WS server + agent loop
│   ├── config.ts                 # Env loader & constants (DRY_RUN, RISK_CONFIG)
│   ├── agent/
│   │   └── agentLoop.ts          # Core loop: monitor → think → risk → execute → broadcast → log
│   ├── indexer/
│   │   └── tokenIndexer.ts       # Rolling-window market data fetcher (in-memory cache)
│   ├── strategies/
│   │   └── momentumStrategy.ts   # Quantitative momentum scoring (price, volume, liquidity)
│   ├── engine/
│   │   └── decisionEngine.ts     # Strategy orchestration + risk gating
│   ├── risk/
│   │   └── riskEngine.ts         # Deterministic risk rules (allocation, exposure, liquidity, cooldown)
│   ├── execution/
│   │   └── executionEngine.ts    # Trade execution abstraction (mock V1)
│   ├── ws/
│   │   └── wsServer.ts           # WebSocket server for real-time frontend updates
│   ├── db/
│   │   └── database.ts           # SQLite persistent storage (decisions + executions)
│   ├── wallet/
│   │   └── signer.ts             # Mock wallet signer
│   ├── logger/
│   │   └── reasoningLogger.ts    # Centralized logger + JSON reasoning persistence
│   └── types/
│       └── index.ts              # Shared TypeScript interfaces
├── scripts/
│   └── sendUSDC.js               # USDC transfer utility (Base network)
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## ⚙️ How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Token       │────▶│  Momentum        │────▶│  Risk       │────▶│  Execution       │
│  Indexer     │     │  Strategy        │     │  Engine     │     │  Engine          │
│  (rolling    │     │  (score 0–100)   │     │  (4 rules)  │     │  (mock/live)     │
│   windows)   │     │                  │     │             │     │                  │
└─────────────┘     └──────────────────┘     └─────────────┘     └──────────────────┘
                                                                          │
                                              ┌───────────────────────────┤
                                              ▼                           ▼
                                        ┌───────────┐             ┌─────────────┐
                                        │  SQLite   │             │  WebSocket  │
                                        │  Storage  │             │  Broadcast  │
                                        └───────────┘             └─────────────┘
```

Each tick of the agent loop:

1. **MONITOR** — Fetch rolling-window market data (price, volume, liquidity)
2. **THINK** — Score each token via momentum strategy (weighted: price 40%, volume 30%, liquidity 30%)
3. **RISK GATE** — Check allocation cap, exposure cap, liquidity floor, cooldown timer
4. **EXECUTE** — Send actionable trades through the execution engine
5. **BROADCAST** — Stream `DECISION`, `TRADE_EXECUTED`, `PORTFOLIO_UPDATE` events via WebSocket
6. **PERSIST** — Save decisions and executions to SQLite + JSON reasoning logs

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### Setup

```bash
# Clone
git clone https://github.com/karanmax999/Claw.Fund.git
cd Claw.Fund

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run in development mode
npm run dev
```

### Build & Run

```bash
npm run build    # Compile TypeScript
npm start        # Run compiled JS
```

---

## 🔧 Configuration

All configuration is via environment variables (`.env`):

| Variable | Default | Description |
|---|---|---|
| `DRY_RUN` | `true` | Prevents real trades when `true` |
| `POLL_INTERVAL_MS` | `10000` | Agent loop interval (ms) |
| `MOMENTUM_THRESHOLD` | `5.0` | Minimum momentum score delta |
| `POSITION_SIZE` | `0.1` | Default position size (fraction) |
| `LOG_LEVEL` | `debug` | Logging verbosity |
| `LOG_DIR` | `./logs` | Directory for reasoning logs |

### Risk Parameters (hardcoded in `config.ts`)

| Parameter | Value | Description |
|---|---|---|
| `maxAllocationPerToken` | 15% | Max portfolio fraction per token |
| `maxTotalExposure` | 60% | Max total portfolio exposure |
| `minLiquidityUsd` | $100,000 | Minimum liquidity to trade |
| `cooldownMinutes` | 5 min | Cooldown between trades on same token |

---

## 📡 WebSocket API

Connect to `ws://localhost:8080` to receive real-time JSON events:

### Event: `DECISION`
```json
{
  "type": "DECISION",
  "decisions": [
    {
      "token": "ALPHA",
      "action": "BUY",
      "confidence": 0.85,
      "momentumScore": 78.3,
      "allocation": 0.12,
      "reason": "priceΔ5m=8.2% | volSpike=1.5x | liqΔ=3.1%"
    }
  ],
  "timestamp": 1707123456789
}
```

### Event: `TRADE_EXECUTED`
```json
{
  "type": "TRADE_EXECUTED",
  "token": "ALPHA",
  "action": "BUY",
  "allocation": 0.12,
  "confidence": 0.85,
  "momentumScore": 78.3,
  "txHash": "0xabc123...",
  "timestamp": 1707123456800
}
```

### Event: `PORTFOLIO_UPDATE`
```json
{
  "type": "PORTFOLIO_UPDATE",
  "portfolioState": {
    "totalExposure": 0.12,
    "allocations": { "0xTokenAddr": 0.12 },
    "positions": 1
  },
  "timestamp": 1707123456810
}
```

---

## 🛠 Development Commands

```bash
npm run dev       # Start with ts-node (hot reload)
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled output
npm run clean     # Remove dist/
```

---

## 📊 Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.3
- **Database:** SQLite (better-sqlite3) — decisions & executions
- **WebSocket:** ws — real-time event broadcasting
- **Blockchain:** ethers.js 6 — Base network integration
- **Logging:** Custom reasoning logger with JSON persistence
- **Architecture:** Modular agent loop with pluggable strategies

---

## 📄 License

MIT

Built by [Claw.Fund](https://github.com/karanmax999/Claw.Fund) 🦀
