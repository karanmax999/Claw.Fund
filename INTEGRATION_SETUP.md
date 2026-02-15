# CLAW.FUND Integration Setup Guide

## Overview

This guide provides step-by-step instructions to set up the complete CLAW.FUND integration with deployed contracts on Monad testnet, autonomous trading backend, and Next.js frontend.

## Prerequisites

- Node.js 18+ and npm
- Git
- A wallet with Monad testnet tokens
- WalletConnect Project ID

## Quick Start

### 1. Environment Configuration

Create `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Update the following variables in `.env.local`:

```env
# Contract Addresses (Already configured for Monad testnet)
NEXT_PUBLIC_CLAW_TOKEN_ADDRESS=0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD
NEXT_PUBLIC_AGENT_TREASURY_ADDRESS=0xA32CB983689376b8FED765727067069084d1fbb6
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x6726a4A8B149F59Db599FEBF450F279e82951560
NEXT_PUBLIC_PROFIT_DISTRIBUTOR_ADDRESS=0x4256b955d4Bf234e484c9A6145F901833881c9e2
NEXT_PUBLIC_QUEST_MANAGER_ADDRESS=0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f

# Network Configuration
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143

# WebSocket Configuration (Backend must be running)
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# WalletConnect Configuration (Get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional Features
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Start the Backend (Optional)

If you want live trading data, start the autonomous trading backend:

```bash
cd backend
npm install
npm start
```

The WebSocket server will run on port 8080.

## Features Integrated

### ✅ Contract Integration
- **Treasury Data**: Real-time TVL, holdings, and pause status from AgentTreasury contract
- **Governance**: Live proposals, voting, and token-gated access
- **Quests**: On-chain quest system with completion verification
- **Token Balances**: CLAW token balance checking and validation

### ✅ WebSocket Live Feed
- Real-time AI trading decisions and reasoning
- Automatic reconnection with exponential backoff
- Transaction hash links to Monad explorer
- Connection state indicators

### ✅ User Experience
- Loading states and skeleton loaders
- Error handling with retry functionality
- Token-gated access to features
- Transaction status notifications
- Mobile-responsive design

### ✅ Property-Based Testing
- 28 comprehensive property tests covering:
  - Environment variable validation
  - Portfolio allocation calculations
  - PnL calculation accuracy
  - WebSocket reconnection logic
  - Trade event rendering
  - Transaction hash formatting

## Component Status

| Component | Status | Description |
|-----------|--------|-------------|
| TreasuryOverview | ✅ Integrated | Shows real contract data with loading/error states |
| LiveFeed | ✅ Integrated | WebSocket connection with real-time trade events |
| ProposalList | ✅ Integrated | Governance proposals with voting functionality |
| QuestList | ✅ Integrated | On-chain quests with completion verification |

## Testing

Run the comprehensive test suite:

```bash
npm test
```

This runs 28 property-based tests with 1,100+ total test iterations covering:
- Environment validation
- Portfolio calculations
- PnL accuracy
- WebSocket behavior
- UI rendering
- Transaction formatting

## Troubleshooting

### Common Issues

1. **"Missing environment variables" error**
   - Ensure `.env.local` exists and contains all required variables
   - Check that `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set

2. **WebSocket connection failed**
   - Ensure backend is running on port 8080
   - Check `NEXT_PUBLIC_WS_URL` in environment variables

3. **Contract read failures**
   - Verify Monad testnet RPC is accessible
   - Check contract addresses are correct
   - Ensure wallet is connected to Monad testnet

4. **Transaction failures**
   - Ensure wallet has sufficient MON for gas
   - Check if user has required CLAW tokens for gated features
   - Verify contract is not paused

### Network Configuration

The app is configured for Monad testnet:
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://explorer.monad.xyz

### Token Requirements

- **Governance Voting**: 100 CLAW tokens minimum
- **Quest Access**: 10 CLAW tokens minimum
- **Gas**: MON tokens for transaction fees

## Architecture

```
Frontend (Next.js) ←→ Monad Testnet Contracts
       ↓
WebSocket Client ←→ Backend Trading Agent
       ↓
Real-time UI Updates
```

## Development

### Adding New Features

1. **Contract Integration**:
   - Add new hooks in `src/hooks/useContracts.ts`
   - Import ABIs in `src/lib/contracts.ts`
   - Create property tests for validation

2. **UI Components**:
   - Follow existing patterns for loading/error states
   - Add token gating where appropriate
   - Include transaction status handling

3. **Testing**:
   - Write property-based tests for core logic
   - Test edge cases and error conditions
   - Ensure 100+ test iterations for reliability

## Production Deployment

1. **Environment Variables**:
   - Set production RPC endpoints
   - Configure production contract addresses
   - Set secure WalletConnect project ID

2. **Performance**:
   - Enable contract read caching
   - Implement request deduplication
   - Configure appropriate polling intervals

3. **Monitoring**:
   - Set up error tracking
   - Monitor WebSocket connection health
   - Track transaction success rates

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the property test results for validation
3. Verify environment configuration
4. Check contract deployment status on Monad explorer

---

**Status**: ✅ MVP Complete - All core features integrated and tested
**Test Coverage**: 28 property-based tests with 1,100+ iterations
**Integration Level**: Full end-to-end with real contracts and live data