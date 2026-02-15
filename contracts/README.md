# CLAW.FUND — On-Chain Smart Contract Stack

The financial backbone of CLAW.FUND: treasury custody, token mechanics, governance, profit distribution, and quest verification — all deployed and verified on **Monad Testnet**.

---

## Deployed Contracts (Monad Testnet — Chain 10143)

| Contract | Address | Explorer |
|---|---|---|
| **CLAWToken** | `0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD` | [View on Monadscan](https://testnet.monadscan.com/address/0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD) |
| **AgentTreasury** | `0xA32CB983689376b8FED765727067069084d1fbb6` | [View on Monadscan](https://testnet.monadscan.com/address/0xA32CB983689376b8FED765727067069084d1fbb6) |
| **Governance** | `0x6726a4A8B149F59Db599FEBF450F279e82951560` | [View on Monadscan](https://testnet.monadscan.com/address/0x6726a4A8B149F59Db599FEBF450F279e82951560) |
| **ProfitDistributor** | `0x4256b955d4Bf234e484c9A6145F901833881c9e2` | [View on Monadscan](https://testnet.monadscan.com/address/0x4256b955d4Bf234e484c9A6145F901833881c9e2) |
| **QuestManager** | `0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f` | [View on Monadscan](https://testnet.monadscan.com/address/0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f) |

**Deployer / Agent:** [`0x356435901c4bF97E2f695a4377087670201e5588`](https://testnet.monadscan.com/address/0x356435901c4bF97E2f695a4377087670201e5588)

---

## Contracts

| Contract | Source | Purpose |
|---|---|---|
| `CLAWToken.sol` | [`src/CLAWToken.sol`](src/CLAWToken.sol) | ERC-20 token (fixed supply, burnable, permit) |
| `AgentTreasury.sol` | [`src/AgentTreasury.sol`](src/AgentTreasury.sol) | Central vault — holds native MON + ERC-20s, agent-gated trades |
| `Governance.sol` | [`src/Governance.sol`](src/Governance.sol) | Token-weighted proposal voting |
| `ProfitDistributor.sol` | [`src/ProfitDistributor.sol`](src/ProfitDistributor.sol) | Distributes treasury profits to $CLAW holders |
| `QuestManager.sol` | [`src/QuestManager.sol`](src/QuestManager.sol) | On-chain quest system with rewards |

---

## Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run all tests (94 tests)
npx hardhat test
```

---

## Deploy to Monad Testnet

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
PRIVATE_KEY=<your_deployer_private_key>
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz
AGENT_ADDRESS=<your_agent_wallet_address>
```

> Make sure the deployer wallet has testnet MON for gas. Get testnet MON from the [Monad faucet](https://faucet.monad.xyz).

### 2. Deploy

```bash
npx hardhat run scripts/deploy.js --network monadTestnet
```

This will:
- Deploy all 5 contracts
- Set AgentTreasury governance to the Governance contract
- Export deployment addresses to `deployments/<network>-deployment.json`
- Export ABIs to `abi/` directory

### 3. Post-deployment steps

1. **Fund AgentTreasury** with native MON tokens
2. **Transfer $CLAW** tokens to AgentTreasury as needed
3. **Whitelist trading tokens** via `AgentTreasury.setTokenAllowed()` (called by governance)
4. **Fund ProfitDistributor** and **QuestManager** with native MON for rewards
5. **Verify contracts** on the block explorer

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

### Roles

- **Agent** (deployer wallet) → executes trades, syncs values, creates quests, attests users
- **Governance** (Governance contract for Treasury; deployer for ProfitDist/QuestMgr) → pause/unpause, update risk params, whitelist tokens

### Access Model

| Role | Permissions |
|---|---|
| **Agent** | Execute trades, sync treasury value, create quests, attest quest completion, distribute profits |
| **Governance** | Update risk parameters, pause/unpause, whitelist tokens, update agent |
| **Users** | Vote on proposals, claim quest rewards, hold $CLAW |

---

## Security

- **ReentrancyGuard** on all state-changing external functions
- **Pausable** on Treasury, ProfitDistributor, QuestManager
- **onlyAgent** / **onlyGovernance** modifiers enforce strict access control
- **No delegatecall** — no arbitrary code execution
- **No upgradeability** — immutable V1 for maximum trust
- **Allocation caps** — agent cannot exceed `maxAllocationBps` per asset
- **SafeERC20** for all token transfers

---

## Tests

| Suite | Count | Status |
|---|---|---|
| Unit tests (Hardhat local) | 94/94 | All passing |
| E2E on-chain (Monad testnet) | 73/73 | All passing |
| **Total** | **167 tests** | **All passing** |

Covering:

- Access control on all contracts
- Trade execution & allocation limits
- Pause/unpause logic
- Governance proposal lifecycle (create → vote → execute)
- Profit threshold & distribution
- Quest creation, verification (on-chain + attested), claiming
- Edge cases (zero amounts, double voting, insufficient balances)

```bash
# Run unit tests (94 tests, local Hardhat network)
npx hardhat test

# Run live e2e tests on Monad testnet (73 tests)
npx hardhat run scripts/e2e/run_all.js --network monadTestnet
```

---

## Project Structure

```
contracts/
├── src/                          # Solidity source files
│   ├── CLAWToken.sol
│   ├── AgentTreasury.sol
│   ├── Governance.sol
│   ├── ProfitDistributor.sol
│   └── QuestManager.sol
├── test/                         # Unit tests (94 passing)
│   ├── CLAWToken.test.js
│   ├── AgentTreasury.test.js
│   ├── Governance.test.js
│   ├── ProfitDistributor.test.js
│   └── QuestManager.test.js
├── scripts/
│   ├── deploy.js                 # Production deploy script
│   └── e2e/                      # Live on-chain e2e tests (73 passing)
│       ├── run_all.js            # E2E test runner
│       ├── helpers.js            # Test utilities
│       ├── 01_clawtoken.js
│       ├── 02_treasury.js
│       ├── 03_governance.js
│       ├── 04_profitdistributor.js
│       └── 05_questmanager.js
├── abi/                          # Exported ABIs for frontend/backend
├── deployments/                  # Deployment addresses + metadata
├── hardhat.config.js             # Monad testnet + verification config
├── .env.example                  # Environment template
└── package.json                  # Hardhat v2.28.6, OpenZeppelin v5
```

| Directory / File | Description |
|---|---|
| [`src/`](src/) | Solidity smart contract source files |
| [`test/`](test/) | Hardhat unit tests (94 tests) |
| [`scripts/deploy.js`](scripts/deploy.js) | Production deployment script |
| [`scripts/e2e/`](scripts/e2e/) | Live on-chain end-to-end tests (73 tests) |
| [`scripts/e2e/run_all.js`](scripts/e2e/run_all.js) | E2E test runner entry point |
| [`abi/`](abi/) | Exported contract ABIs for frontend/backend integration |
| [`deployments/`](deployments/) | Deployment addresses and metadata per network |
| [`hardhat.config.js`](hardhat.config.js) | Hardhat configuration (Monad testnet, Sourcify, Etherscan) |

---

## Key Events (for frontend/backend integration)

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

## Configuration Defaults

| Parameter | Default | Description |
|---|---|---|
| Initial CLAW supply | 1,000,000 | Fixed supply minted to deployer |
| Max allocation per asset | 2000 bps (20%) | Agent trade limit |
| Voting period | 7200 blocks (~1 day) | Governance proposal duration |
| Min proposal tokens | 100 CLAW | Required to create proposal |
| Profit threshold | 1 MON | Minimum profit to trigger distribution |
| Distribution percentage | 5000 bps (50%) | Profit share to holders |
