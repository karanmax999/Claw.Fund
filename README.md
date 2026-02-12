# CLAW.FUND

**AI-Powered Autonomous Trading Fund on Monad** — treasury custody, token mechanics, governance, profit distribution, quest gamification, and a real-time autonomous trading agent backend.

---

## Overview

Claw.Fund is a fully on-chain autonomous trading fund where an AI agent manages a treasury, executes trades, and distributes profits to $CLAW token holders. The system combines:

- **5 Solidity smart contracts** deployed on Monad testnet — handling custody, governance, profit sharing, and gamified quests
- **Autonomous trading agent backend** — TypeScript service with momentum scoring, risk gating, and real-time WebSocket broadcasting

---

## Repository Structure

```
Claw.Fund/
├── contracts/              # Solidity smart contracts (Hardhat)
│   ├── src/                # 5 Solidity contracts
│   │   ├── CLAWToken.sol
│   │   ├── AgentTreasury.sol
│   │   ├── Governance.sol
│   │   ├── ProfitDistributor.sol
│   │   └── QuestManager.sol
│   ├── test/               # Unit tests (94/94 passing)
│   ├── scripts/
│   │   ├── deploy.js       # Production deploy script
│   │   └── e2e/            # Live on-chain e2e tests (73/73 passing)
│   ├── abi/                # Exported ABIs for frontend/backend
│   ├── deployments/        # Deployment addresses + metadata
│   └── hardhat.config.js   # Monad testnet + verification config
│
├── backend/                # Autonomous trading agent (TypeScript)
│   ├── src/
│   │   ├── agent/          # Core agent loop
│   │   ├── indexer/        # Rolling-window market data
│   │   ├── strategies/     # Momentum scoring strategy
│   │   ├── engine/         # Decision orchestration
│   │   ├── risk/           # Deterministic risk gate
│   │   ├── execution/      # Trade execution layer
│   │   ├── ws/             # WebSocket server
│   │   ├── db/             # SQLite persistence
│   │   └── logger/         # Reasoning logger
│   └── package.json
│
└── README.md               # This file
```

---

## Deployed Contracts (Monad Testnet — Chain 10143)

| Contract | Address | Explorer |
|---|---|---|
| **CLAWToken** | `0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD` | [View](https://testnet.monadscan.com/address/0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD) |
| **AgentTreasury** | `0xA32CB983689376b8FED765727067069084d1fbb6` | [View](https://testnet.monadscan.com/address/0xA32CB983689376b8FED765727067069084d1fbb6) |
| **Governance** | `0x6726a4A8B149F59Db599FEBF450F279e82951560` | [View](https://testnet.monadscan.com/address/0x6726a4A8B149F59Db599FEBF450F279e82951560) |
| **ProfitDistributor** | `0x4256b955d4Bf234e484c9A6145F901833881c9e2` | [View](https://testnet.monadscan.com/address/0x4256b955d4Bf234e484c9A6145F901833881c9e2) |
| **QuestManager** | `0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f` | [View](https://testnet.monadscan.com/address/0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f) |

**Deployer / Agent:** `0x356435901c4bF97E2f695a4377087670201e5588`

---

## How the 5 Contracts Connect

```
                    ┌──────────────────┐
                    │    CLAWToken      │  ERC20 (1M supply)
                    │  (fixed supply)   │  burn, permit
                    └────────┬─────────┘
                             │ balanceOf checks
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                   ▼
┌─────────────────┐ ┌───────────────┐ ┌──────────────────┐
│  Governance      │ │ ProfitDist    │ │  QuestManager    │
│  (propose/vote)  │ │ (sync/dist)   │ │  (create/claim)  │
└────────┬────────┘ └───────┬───────┘ └──────────────────┘
         │ governance role   │ reads treasury value
         ▼                   ▼
┌──────────────────────────────────────┐
│          AgentTreasury               │
│  (holds MON + ERC20, executes trades)│
└──────────────────────────────────────┘
```

**Roles:**

- **Agent** (deployer wallet) → executes trades, syncs values, creates quests, attests users
- **Governance** (Governance contract for Treasury; deployer for ProfitDist/QuestMgr) → pause/unpause, update risk params, whitelist tokens

---

## Smart Contracts

### CLAWToken

ERC-20 token with fixed 1M supply, burn, and EIP-2612 permit.

- `transfer`, `approve`, `transferFrom` — standard ERC-20
- `burn(amount)` — permanently destroy tokens, reduces totalSupply
- Permit support for gasless approvals

### AgentTreasury

Central vault holding native MON + ERC-20 tokens. Agent trades, governance controls risk.

- **Fund treasury** — send MON directly to contract
- **Whitelist tokens** — `setTokenAllowed(token, true)` (governance only)
- **Execute trades** — `executeTrade(token, amount, isBuy)` (agent only)
- **Risk check** — auto-reverts if allocation > `maxAllocationBps` (20%)
- **Pause/Unpause** — all trades blocked when paused

### Governance

Token-weighted proposal voting for CLAW holders.

- **Create proposal** — requires >= 100 CLAW
- **Vote** — weight = caller's CLAW balance at vote time
- **Execute** — after voting period ends + majority FOR votes
- Voting period: 7200 blocks (~1 day)

### ProfitDistributor

Distributes treasury profits to CLAW holders when threshold is met.

- **Sync treasury value** — agent reports latest value
- **Auto-detect profit** — triggers distribution when profit >= threshold
- **Batch distribute** — sends MON rewards to holders
- Profit threshold: 1 MON, distribution: 50% of profit

### QuestManager

Gamified quest system with 3 quest types:

| Type | Verification |
|---|---|
| **HoldTokens** | On-chain: checks `clawToken.balanceOf(user) >= threshold` |
| **ProvideLiquidity** | Off-chain: agent calls `attestQuest(questId, user)` |
| **ParticipateVote** | Off-chain: agent calls `attestQuest(questId, user)` |

---

## Trading Agent Backend

The autonomous trading agent runs a continuous loop:

1. **MONITOR** — Fetch rolling-window market data (price, volume, liquidity)
2. **THINK** — Score each token via momentum strategy (price 40%, volume 30%, liquidity 30%)
3. **RISK GATE** — Check allocation cap, exposure cap, liquidity floor, cooldown timer
4. **EXECUTE** — Send actionable trades through the execution engine
5. **BROADCAST** — Stream events via WebSocket (`ws://localhost:8080`)
6. **PERSIST** — Save decisions and executions to SQLite + JSON reasoning logs

### Risk Rules

| Rule | Threshold |
|---|---|
| Per-token allocation cap | 15% of portfolio |
| Total exposure cap | 60% of portfolio |
| Minimum liquidity floor | $100,000 USD |
| Per-token cooldown | 5 minutes |

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### Contracts

```bash
cd contracts
npm install

# Compile
npx hardhat compile

# Run unit tests (94 tests)
npx hardhat test

# Deploy to Monad testnet
cp .env.example .env    # add PRIVATE_KEY, RPC, AGENT_ADDRESS
npx hardhat run scripts/deploy.js --network monadTestnet

# Run live e2e tests on Monad testnet (73 tests)
npx hardhat run scripts/e2e/run_all.js --network monadTestnet
```

### Backend

```bash
cd backend
npm install
cp .env.example .env    # configure settings

# Development
npm run dev

# Production
npm run build
npm start
```

---

## Test Results

| Suite | Count | Status |
|---|---|---|
| Unit tests (Hardhat local) | 94/94 | All passing |
| E2E on-chain (Monad testnet) | 73/73 | All passing |
| **Total** | **167 tests** | **All passing** |

---

## Security

- **ReentrancyGuard** on Treasury, ProfitDistributor, QuestManager, Governance
- **Pausable** on Treasury, ProfitDistributor, QuestManager
- **onlyAgent** / **onlyGovernance** modifiers enforce strict access control
- **Max allocation risk check** prevents over-concentration in a single asset
- **SafeERC20** for all token transfers
- **Zero-address checks** on all constructors
- **No delegatecall** — no arbitrary code execution
- **No upgradeability** — immutable V1 for maximum trust
- **Events emitted** on every state change for full transparency

---

## Configuration Defaults

| Parameter | Default | Description |
|---|---|---|
| Initial CLAW supply | 1,000,000 | Fixed supply minted to deployer |
| Max allocation per asset | 2000 bps (20%) | Agent trade limit |
| Voting period | 7200 blocks (~1 day) | Governance proposal duration |
| Min proposal tokens | 100 CLAW | Required to create proposal |
| Profit threshold | 1 MON | Minimum profit to trigger distribution |
| Distribution percentage | 5000 bps (50%) | Profit share to holders |

---

## Key Events (for frontend integration)

| Event | Contract |
|---|---|
| `TradeExecuted` | AgentTreasury |
| `RiskUpdated` | AgentTreasury |
| `ProposalCreated` | Governance |
| `VoteCast` | Governance |
| `ProposalExecuted` | Governance |
| `ProfitDistributed` | ProfitDistributor |
| `RewardClaimed` | ProfitDistributor |
| `QuestCreated` | QuestManager |
| `QuestCompleted` | QuestManager |

---

## Tech Stack

- **Smart Contracts:** Solidity 0.8.24, OpenZeppelin v5, Hardhat v2.28.6
- **Chain:** Monad Testnet (Chain ID 10143)
- **Backend:** TypeScript 5.3, Node.js 18+
- **Database:** SQLite (better-sqlite3)
- **Real-time:** WebSocket (ws)
- **Blockchain SDK:** ethers.js v6

---

## License

MIT
