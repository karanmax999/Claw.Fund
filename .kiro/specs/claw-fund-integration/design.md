# Design Document: CLAW.FUND Integration

## Overview

This design outlines the complete end-to-end integration of CLAW.FUND's three components: deployed Solidity contracts on Monad testnet, TypeScript autonomous trading backend with WebSocket server, and Next.js frontend. The integration will replace all mock data with real contract reads, establish WebSocket connections for live AI decision streaming, and enable on-chain interactions for governance and quests.

The architecture follows a three-tier model:
1. **Smart Contract Layer**: Five deployed contracts on Monad testnet providing on-chain state and logic
2. **Backend Layer**: Autonomous trading agent with WebSocket broadcasting for real-time updates
3. **Frontend Layer**: Next.js application with Wagmi/Viem for contract interactions and WebSocket client for live feeds

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  Governance  │  │    Quests    │      │
│  │  Components  │  │  Components  │  │  Components  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴───────┐    │
│  │           Wagmi Hooks & Contract Reads              │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────────────┐    │
│  │         WebSocket Client (Live Feed)                 │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼──────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  Monad Testnet  │  │     Backend     │  │   Environment    │
│   (Chain ID:    │  │   WebSocket     │  │   Variables      │
│     10143)      │  │   Server :8080  │  │   (.env.local)   │
│                 │  │                 │  │                  │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ - Contract Addrs │
│ │ CLAWToken   │ │  │ │ Agent Loop  │ │  │ - RPC Endpoints  │
│ │ Treasury    │ │  │ │ Trade Logic │ │  │ - WalletConnect  │
│ │ Governance  │ │  │ │ SQLite DB   │ │  │ - WebSocket URL  │
│ │ Distributor │ │  │ └─────────────┘ │  └──────────────────┘
│ │ QuestMgr    │ │  └─────────────────┘
│ └─────────────┘ │
└─────────────────┘
```

### Data Flow

**Contract Read Flow:**
1. Component mounts → Wagmi hook initiates contract read
2. Viem sends RPC request to Monad testnet
3. Contract returns data → Wagmi hook updates React state
4. Component renders with real data

**WebSocket Flow:**
1. LiveFeed component establishes WebSocket connection
2. Backend agent makes trading decision
3. Backend broadcasts event via WebSocket
4. Frontend receives event and updates UI in real-time

**Transaction Flow:**
1. User initiates action (vote, complete quest)
2. RainbowKit prompts wallet signature
3. Transaction submitted to Monad testnet
4. Frontend shows pending state
5. Transaction confirmed → UI updates optimistically
6. Contract event emitted → Wagmi invalidates cache

## Components and Interfaces

### Frontend Configuration Module

**Purpose:** Centralize all contract addresses, ABIs, and chain configuration.

**Location:** `src/lib/contracts.ts`

**Interface:**
```typescript
// Contract addresses from deployment JSON
export const CONTRACTS = {
  CLAWToken: '0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD',
  AgentTreasury: '0xA32CB983689376b8FED765727067069084d1fbb6',
  Governance: '0x6726a4A8B149F59Db599FEBF450F279e82951560',
  ProfitDistributor: '0x4256b955d4Bf234e484c9A6145F901833881c9e2',
  QuestManager: '0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f'
} as const;

// Import ABIs
export { default as CLAWTokenABI } from '@/contracts/abi/CLAWToken.json';
export { default as AgentTreasuryABI } from '@/contracts/abi/AgentTreasury.json';
export { default as GovernanceABI } from '@/contracts/abi/Governance.json';
export { default as ProfitDistributorABI } from '@/contracts/abi/ProfitDistributor.json';
export { default as QuestManagerABI } from '@/contracts/abi/QuestManager.json';

// Monad testnet chain configuration
export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL!] },
    public: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL!] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
  testnet: true,
} as const;
```

### Wagmi Configuration Module

**Purpose:** Configure Wagmi with RainbowKit, Monad testnet, and contract setup.

**Location:** `src/lib/wagmi.ts`

**Interface:**
```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monadTestnet } from './contracts';

export const wagmiConfig = getDefaultConfig({
  appName: 'CLAW.FUND',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [monadTestnet],
  ssr: true,
});
```

### Contract Hooks Module

**Purpose:** Provide typed React hooks for all contract interactions.

**Location:** `src/hooks/useContracts.ts`

**Interface:**
```typescript
import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { CONTRACTS, AgentTreasuryABI, GovernanceABI } from '@/lib/contracts';

// Treasury hooks
export function useTreasuryBalance() {
  return useReadContract({
    address: CONTRACTS.AgentTreasury,
    abi: AgentTreasuryABI,
    functionName: 'getTotalValue',
  });
}

export function useTreasuryHoldings() {
  return useReadContract({
    address: CONTRACTS.AgentTreasury,
    abi: AgentTreasuryABI,
    functionName: 'getHoldings',
  });
}

// Governance hooks
export function useProposals() {
  return useReadContract({
    address: CONTRACTS.Governance,
    abi: GovernanceABI,
    functionName: 'getAllProposals',
  });
}

export function useVoteOnProposal() {
  return useWriteContract();
}

// Token balance hook
export function useCLAWBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.CLAWToken,
    abi: CLAWTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}
```

### WebSocket Client Module

**Purpose:** Manage WebSocket connection and event streaming.

**Location:** `src/hooks/useWebSocket.ts`

**Interface:**
```typescript
import { useEffect, useState, useCallback } from 'react';

export interface TradeEvent {
  id: string;
  type: 'BUY' | 'SELL';
  token: string;
  allocation: number;
  confidence: number;
  reasoning: string;
  timestamp: number;
  txHash?: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket(url: string) {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    const socket = new WebSocket(url);
    
    socket.onopen = () => setConnectionState('connected');
    socket.onclose = () => {
      setConnectionState('disconnected');
      // Exponential backoff reconnection
      setTimeout(connect, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
    };
    socket.onerror = () => setConnectionState('disconnected');
    socket.onmessage = (event) => {
      const tradeEvent: TradeEvent = JSON.parse(event.data);
      setEvents(prev => [tradeEvent, ...prev].slice(0, 50));
    };

    setWs(socket);
  }, [url]);

  useEffect(() => {
    connect();
    return () => ws?.close();
  }, [connect]);

  return { events, connectionState, reconnect: connect };
}
```

### Updated TreasuryOverview Component

**Purpose:** Display real treasury data from AgentTreasury contract.

**Location:** `src/components/dashboard/TreasuryOverview.tsx`

**Changes:**
- Replace hardcoded values with `useTreasuryBalance()` hook
- Add loading skeleton while data fetches
- Calculate 24h PnL from historical trades (backend API)
- Display error states with retry button

**Interface:**
```typescript
export function TreasuryOverview() {
  const { data: tvl, isLoading, error, refetch } = useTreasuryBalance();
  const { data: pnl24h } = use24hPnL(); // Backend API call
  const { data: holdings } = useTreasuryHoldings();

  if (isLoading) return <TreasurySkeleton />;
  if (error) return <ErrorCard onRetry={refetch} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        label="Total Treasury Value"
        value={formatCurrency(tvl)}
        delta={calculateDelta(tvl, pnl24h)}
        highlight
      />
      {/* ... other cards with real data */}
    </div>
  );
}
```

### Updated LiveFeed Component

**Purpose:** Display real-time AI trading decisions via WebSocket.

**Location:** `src/components/layout/LiveFeed.tsx`

**Changes:**
- Replace mock data generation with `useWebSocket()` hook
- Add connection state indicator
- Add reconnection logic
- Display transaction hashes with explorer links

**Interface:**
```typescript
export function LiveFeed() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
  const { events, connectionState, reconnect } = useWebSocket(wsUrl);

  return (
    <div className="w-80 h-screen border-l border-white/5 bg-claw-bg flex flex-col fixed right-0 top-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-mono text-sm text-claw-dim flex items-center gap-2">
          <Radio className={`h-4 w-4 ${connectionState === 'connected' ? 'text-claw-green animate-pulse' : 'text-red-500'}`} />
          LIVE_DECISION_FEED
        </h2>
        <Badge variant="outline">
          {connectionState.toUpperCase()}
        </Badge>
      </div>
      {/* Render events with real data */}
    </div>
  );
}
```

### Updated ProposalList Component

**Purpose:** Display and interact with real governance proposals.

**Location:** `src/components/governance/ProposalList.tsx`

**Changes:**
- Replace mock proposals with `useProposals()` hook
- Implement real voting with `useVoteOnProposal()` hook
- Add transaction confirmation handling
- Check user CLAW balance for voting eligibility

**Interface:**
```typescript
export function ProposalList() {
  const { data: proposals, isLoading } = useProposals();
  const { writeContract, isPending } = useVoteOnProposal();
  const { address } = useAccount();
  const { data: clawBalance } = useCLAWBalance(address);

  const handleVote = async (proposalId: bigint, support: boolean) => {
    await writeContract({
      address: CONTRACTS.Governance,
      abi: GovernanceABI,
      functionName: 'vote',
      args: [proposalId, support],
    });
  };

  const canVote = clawBalance && clawBalance >= MIN_VOTING_TOKENS;

  return (
    <div className="space-y-4">
      {proposals?.map(proposal => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onVote={handleVote}
          canVote={canVote}
          isPending={isPending}
        />
      ))}
    </div>
  );
}
```

### Backend WebSocket Server Enhancement

**Purpose:** Broadcast trade events with proper structure for frontend consumption.

**Location:** `backend/src/ws/wsServer.ts`

**Changes:**
- Add structured event format matching `TradeEvent` interface
- Include transaction hashes when trades execute
- Add connection health monitoring

**Interface:**
```typescript
export interface BroadcastEvent {
  id: string;
  type: 'BUY' | 'SELL';
  token: string;
  allocation: number;
  confidence: number;
  reasoning: string;
  timestamp: number;
  txHash?: string;
}

export function broadcastTradeDecision(event: BroadcastEvent): void {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  });
}
```

## Data Models

### Contract Data Types

```typescript
// Treasury types
export interface TreasuryData {
  totalValue: bigint;
  holdings: Array<{
    token: string;
    amount: bigint;
    value: bigint;
  }>;
  maxAllocationBps: number;
  isPaused: boolean;
}

// Governance types
export interface Proposal {
  id: bigint;
  proposer: `0x${string}`;
  title: string;
  description: string;
  votesFor: bigint;
  votesAgainst: bigint;
  startTime: bigint;
  endTime: bigint;
  executed: boolean;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';
}

// Quest types
export interface Quest {
  id: bigint;
  creator: `0x${string}`;
  description: string;
  reward: bigint;
  isActive: boolean;
  completedBy: `0x${string}`[];
}

// Token types
export interface TokenBalance {
  address: `0x${string}`;
  balance: bigint;
  decimals: number;
  symbol: string;
}
```

### Environment Variables Schema

```typescript
// .env.local structure
export interface EnvironmentConfig {
  // Contract addresses
  NEXT_PUBLIC_CLAW_TOKEN_ADDRESS: string;
  NEXT_PUBLIC_AGENT_TREASURY_ADDRESS: string;
  NEXT_PUBLIC_GOVERNANCE_ADDRESS: string;
  NEXT_PUBLIC_PROFIT_DISTRIBUTOR_ADDRESS: string;
  NEXT_PUBLIC_QUEST_MANAGER_ADDRESS: string;

  // Network configuration
  NEXT_PUBLIC_MONAD_RPC_URL: string;
  NEXT_PUBLIC_CHAIN_ID: string;

  // WebSocket
  NEXT_PUBLIC_WS_URL: string;

  // WalletConnect
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string;

  // Feature flags
  NEXT_PUBLIC_ENABLE_DEMO_MODE?: string;
}
```

### Performance Data Types

```typescript
// Historical performance data from backend
export interface PerformanceData {
  timestamp: number;
  cumulativePnL: number;
  portfolioValue: number;
  trades: number;
}

// Chart data format
export interface ChartDataPoint {
  time: string;
  value: number;
  label?: string;
}

// Allocation data
export interface AllocationData {
  token: string;
  percentage: number;
  value: number;
  color: string;
}
```

