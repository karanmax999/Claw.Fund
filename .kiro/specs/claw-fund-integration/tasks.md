# Implementation Plan: CLAW.FUND Integration

## Overview

This implementation plan connects the three components of CLAW.FUND: deployed Solidity contracts on Monad testnet, TypeScript autonomous trading backend with WebSocket server, and Next.js frontend. The integration will replace all mock data with real contract reads, establish WebSocket connections for live AI decision streaming, and enable on-chain interactions for governance and quests.

The implementation follows an incremental approach: first establishing contract configuration and basic reads, then adding WebSocket real-time feeds, followed by transaction capabilities, and finally optimization and polish.

## Tasks

- [x] 1. Set up contract configuration and environment
  - [x] 1.1 Create contract configuration module with ABIs and addresses
    - Create `src/lib/contracts.ts` with all five contract addresses from deployment
    - Import ABIs from `contracts/abi/` directory (CLAWToken, AgentTreasury, Governance, ProfitDistributor, QuestManager)
    - Define Monad testnet chain configuration with Chain ID 10143
    - Export typed contract constants
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.3_
  
  - [x] 1.2 Configure Wagmi with RainbowKit and Monad testnet
    - Create `src/lib/wagmi.ts` with Wagmi configuration
    - Configure RainbowKit with WalletConnect project ID
    - Add Monad testnet as supported chain
    - Enable SSR support for Next.js
    - _Requirements: 1.3, 1.4, 7.4_
  
  - [x] 1.3 Create environment configuration files
    - Create `.env.local.example` with all required variables documented
    - Add contract addresses as NEXT_PUBLIC_ environment variables
    - Add Monad RPC URL, WebSocket URL, and WalletConnect project ID
    - Add validation for missing environment variables on app startup
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 1.4 Write property test for environment variable validation
    - **Property 10: Error Logging Completeness**
    - **Validates: Requirements 11.5**
    - Test that missing environment variables produce clear error messages with variable names

- [x] 2. Implement contract read hooks and treasury integration
  - [x] 2.1 Create typed contract hooks module
    - Create `src/hooks/useContracts.ts` with Wagmi hooks
    - Implement `useTreasuryBalance()` for reading total value locked
    - Implement `useTreasuryHoldings()` for reading portfolio holdings
    - Implement `useCLAWBalance(address)` for reading user token balance
    - Implement `useProposals()` for reading governance proposals
    - Implement `useQuests()` for reading active quests
    - _Requirements: 2.1, 2.3, 4.1, 5.1, 6.1_
  
  - [x] 2.2 Update TreasuryOverview component with real contract data
    - Replace mock TVL with `useTreasuryBalance()` hook
    - Replace mock holdings with `useTreasuryHoldings()` hook
    - Add loading skeleton component for data fetching states
    - Add error state with retry button for failed contract reads
    - Implement automatic data refresh on block updates
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 12.1_
  
  - [x] 2.3 Write property test for portfolio allocation calculation
    - **Property 8: Portfolio Allocation Percentage Accuracy**
    - **Validates: Requirements 8.3**
    - Test that allocation percentages sum to 100% and each token percentage equals (token_value / total_value) * 100
  
  - [x] 2.4 Create backend API endpoint for 24h PnL calculation
    - Create `/api/performance/24h` endpoint in Next.js API routes
    - Query SQLite database for trades in last 24 hours
    - Calculate PnL as sum of (sell_price - buy_price) * quantity
    - Return formatted PnL data with timestamp
    - _Requirements: 2.2_
  
  - [x] 2.5 Write property test for PnL calculation accuracy
    - **Property 1: PnL Calculation Accuracy**
    - **Validates: Requirements 2.2**
    - Test that 24h PnL equals sum of (sell_price - buy_price) * quantity for trades in window

- [x] 3. Implement WebSocket client and live feed integration
  - [x] 3.1 Create WebSocket client hook
    - Create `src/hooks/useWebSocket.ts` with connection management
    - Implement connection state tracking (connecting, connected, disconnected)
    - Implement automatic reconnection with exponential backoff
    - Implement event parsing and state management for trade events
    - Add connection health monitoring
    - _Requirements: 3.1, 3.3, 3.5_
  
  - [x] 3.2 Write property test for WebSocket reconnection logic
    - **Property 2: WebSocket Reconnection with Exponential Backoff**
    - **Validates: Requirements 3.3, 3.5**
    - Test that reconnection delays follow exponential backoff pattern (capped at maximum)
  
  - [x] 3.3 Update LiveFeed component with real WebSocket data
    - Replace mock event generation with `useWebSocket()` hook
    - Add connection state indicator with visual feedback
    - Display trade events with all required fields (type, token, allocation, confidence, reasoning)
    - Add transaction hash links to Monad explorer
    - Implement event list with 50-item limit
    - _Requirements: 3.1, 3.2, 3.4, 3.6_
  
  - [x] 3.4 Write property test for trade event rendering completeness
    - **Property 3: Complete Trade Event Rendering**
    - **Validates: Requirements 3.4, 4.2, 5.2**
    - Test that rendered events contain all required fields
  
  - [x] 3.5 Write property test for transaction hash link formatting
    - **Property 4: Transaction Hash Link Formatting**
    - **Validates: Requirements 3.6, 9.6**
    - Test that transaction hash URLs follow correct format

- [ ] 4. Checkpoint - Verify contract reads and WebSocket connection
  - Ensure all tests pass, verify contract data displays correctly, confirm WebSocket connects and receives events. Ask the user if questions arise.

- [x] 5. Implement governance integration with voting
  - [x] 5.1 Create governance write hooks
    - Add `useVoteOnProposal()` hook using `useWriteContract`
    - Add `useCreateProposal()` hook for proposal creation
    - Add transaction state management (pending, success, error)
    - _Requirements: 4.3_
  
  - [x] 5.2 Update ProposalList component with real proposals
    - Replace mock proposals with `useProposals()` hook
    - Display proposal ID, title, description, vote counts, and time remaining
    - Add loading states for proposal fetching
    - _Requirements: 4.1, 4.2_
  
  - [x] 5.3 Implement voting functionality with token gating
    - Check user CLAW balance with `useCLAWBalance()` hook
    - Disable voting buttons if balance below minimum threshold
    - Display required token amount and current balance
    - Implement vote transaction submission with `useVoteOnProposal()`
    - Add optimistic UI updates for vote counts
    - _Requirements: 4.3, 6.1, 6.2, 6.3, 12.2_
  
  - [x] 5.4 Write property test for proposal status calculation
    - **Property 5: Proposal Status Calculation**
    - **Validates: Requirements 4.5**
    - Test that proposal status is correctly calculated based on votes and end time
  
  - [x] 5.5 Write property test for token-based access control
    - **Property 7: Token-Based Access Control**
    - **Validates: Requirements 6.2, 6.3**
    - Test that buttons are disabled when balance is below threshold

- [x] 6. Implement quest system integration
  - [x] 6.1 Create quest write hooks
    - Add `useCompleteQuest()` hook using `useWriteContract`
    - Add transaction state management for quest completion
    - _Requirements: 5.3_
  
  - [x] 6.2 Update QuestList component with real quests
    - Replace mock quests with `useQuests()` hook
    - Display quest ID, description, reward amount, and completion status
    - Filter quests by user eligibility
    - Add loading states for quest fetching
    - _Requirements: 5.1, 5.2, 5.5_
  
  - [x] 6.3 Implement quest completion functionality
    - Implement quest completion transaction submission
    - Update quest status on transaction confirmation
    - Display reward amount on successful completion
    - Add token gating for quest access
    - _Requirements: 5.3, 5.4, 6.2_
  
  - [x] 6.4 Write property test for quest eligibility filtering
    - **Property 6: Quest Eligibility Filtering**
    - **Validates: Requirements 5.5**
    - Test that filtered quests exclude completed quests and inactive quests

- [ ] 7. Implement transaction handling and user feedback
  - [ ] 7.1 Create transaction notification system
    - Create toast notification component for transaction states
    - Implement pending notification with transaction hash
    - Implement success notification with confirmation
    - Implement error notification with failure reason
    - Add transaction hash links to Monad explorer
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_
  
  - [ ] 7.2 Add transaction state management to all write operations
    - Add loading states to vote buttons during pending transactions
    - Add loading states to quest completion buttons
    - Disable action buttons during pending transactions
    - Revert optimistic updates on transaction failure
    - _Requirements: 9.1, 9.5, 12.3_
  
  - [ ] 7.3 Implement error handling and retry logic
    - Add retry logic for failed contract reads (3 attempts with exponential backoff)
    - Add retry buttons to error states
    - Clear user data on wallet disconnection
    - Log all errors to console with context
    - _Requirements: 11.1, 11.4, 11.5_
  
  - [ ] 7.4 Write property test for contract read retry logic
    - **Property 9: Contract Read Retry Logic**
    - **Validates: Requirements 11.1**
    - Test that failed reads retry 3 times with exponential backoff delays

- [ ] 8. Checkpoint - Verify transactions and error handling
  - Ensure all tests pass, verify voting and quest completion work, confirm error states display correctly. Ask the user if questions arise.

- [ ] 9. Implement performance data visualization
  - [ ] 9.1 Create backend API endpoint for historical performance data
    - Create `/api/performance/history` endpoint with time range parameter
    - Query SQLite database for historical trades
    - Calculate cumulative PnL over time
    - Return formatted chart data with timestamps and values
    - _Requirements: 8.1, 8.4_
  
  - [ ] 9.2 Update PerformanceChart component with real data
    - Replace mock chart data with API call to `/api/performance/history`
    - Plot cumulative PnL over time using Recharts
    - Add time range selector (24h, 7d, 30d, All)
    - Implement data caching for 60 seconds
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
  
  - [ ] 9.3 Update AllocationChart component with real holdings
    - Replace mock allocation data with `useTreasuryHoldings()` hook
    - Calculate allocation percentages from holdings
    - Display portfolio distribution with token names and percentages
    - _Requirements: 8.3_
  
  - [ ] 9.4 Write property test for data caching consistency
    - **Property 11: Data Caching Consistency**
    - **Validates: Requirements 8.5, 12.5, 15.3**
    - Test that cached data is returned within cache duration without new requests

- [ ] 10. Implement mobile responsiveness
  - [ ] 10.1 Make LiveFeed responsive with collapsible drawer
    - Convert LiveFeed to collapsible drawer on mobile viewports (<768px)
    - Add toggle button for opening/closing drawer
    - Ensure drawer overlays content with proper z-index
    - _Requirements: 13.1_
  
  - [ ] 10.2 Make treasury cards responsive with vertical stacking
    - Update TreasuryOverview grid to stack vertically on mobile
    - Adjust card spacing for mobile viewports
    - _Requirements: 13.2_
  
  - [ ] 10.3 Make governance proposals responsive
    - Move vote buttons below proposal details on mobile
    - Ensure proper spacing and touch target sizes
    - _Requirements: 13.3_
  
  - [ ] 10.4 Optimize wallet connection for mobile
    - Configure RainbowKit for mobile-optimized wallet flows
    - Test wallet connection on mobile browsers
    - _Requirements: 13.4_
  
  - [ ] 10.5 Write property test for touch target sizes
    - **Property 12: Interactive Element Touch Target Size**
    - **Validates: Requirements 13.5**
    - Test that all interactive elements have minimum 44x44 pixel dimensions
  
  - [ ] 10.6 Write property test for responsive layout adaptation
    - **Property 13: Responsive Layout Adaptation**
    - **Validates: Requirements 13.1, 13.2, 13.3**
    - Test that layouts adapt correctly below mobile breakpoint

- [ ] 11. Implement contract read optimization
  - [ ] 11.1 Add multicall batching for contract reads
    - Identify contract reads that can be batched together
    - Implement multicall using Wagmi's multicall functionality
    - Batch treasury reads (TVL, holdings, pause state)
    - Batch governance reads (proposals, vote counts)
    - _Requirements: 15.1_
  
  - [ ] 11.2 Implement request deduplication
    - Configure Wagmi query client to deduplicate identical requests
    - Add query keys for proper cache management
    - _Requirements: 15.2_
  
  - [ ] 11.3 Configure polling intervals and cache strategies
    - Set appropriate polling intervals for different data types
    - Configure stale-while-revalidate for infrequently changing data
    - Invalidate cache on block updates for frequently changing data
    - _Requirements: 15.3, 15.4, 15.5_

- [ ] 12. Implement demo mode for presentations
  - [ ] 12.1 Create demo mode toggle and state management
    - Add demo mode toggle in UI (keyboard shortcut: Ctrl+Shift+D)
    - Create demo mode context for global state
    - _Requirements: 14.1, 14.4_
  
  - [ ] 12.2 Create curated demo data
    - Create realistic sample treasury data with impressive metrics
    - Create sample governance proposals with active voting
    - Create sample trade events with compelling AI reasoning
    - _Requirements: 14.2, 14.3_
  
  - [ ] 12.3 Implement demo mode data switching
    - Switch between real and demo data based on demo mode state
    - Accelerate trade event generation in demo mode
    - Display demo mode indicator in UI
    - _Requirements: 14.2, 14.5_
  
  - [ ] 12.4 Write property test for demo mode data switching
    - **Property 14: Demo Mode Data Switching**
    - Test that data source switches correctly when demo mode is toggled

- [ ] 13. Implement development tooling and health checks
  - [ ] 13.1 Create backend health check endpoint
    - Add `/health` endpoint to backend WebSocket server
    - Return service status, WebSocket connection count, database status
    - _Requirements: 10.2_
  
  - [ ] 13.2 Create frontend health check endpoint
    - Add `/api/health` endpoint to Next.js API routes
    - Return application status, environment configuration status
    - _Requirements: 10.3_
  
  - [ ] 13.3 Create startup script for all services
    - Create `scripts/dev.sh` that launches frontend and backend
    - Add health check polling to verify services are ready
    - Add clear console output for service status
    - _Requirements: 10.1_
  
  - [ ] 13.4 Create development documentation
    - Document how to run each component individually
    - Document common integration issues and solutions
    - Document environment variable requirements
    - _Requirements: 10.4, 10.5_

- [ ] 14. Final integration testing and polish
  - [ ] 14.1 Test complete user flows end-to-end
    - Test wallet connection and network switching
    - Test treasury data display and updates
    - Test governance voting flow
    - Test quest completion flow
    - Test WebSocket connection and reconnection
    - _Requirements: All_
  
  - [ ] 14.2 Verify error states and edge cases
    - Test behavior with disconnected wallet
    - Test behavior with insufficient CLAW tokens
    - Test behavior with failed transactions
    - Test behavior with network errors
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 14.3 Optimize performance and loading states
    - Verify all loading skeletons display correctly
    - Verify data caching reduces unnecessary requests
    - Verify optimistic updates provide responsive feedback
    - _Requirements: 12.1, 12.2, 12.4, 12.5_
  
  - [ ] 14.4 Run all property-based tests
    - Execute all property tests with minimum 100 iterations each
    - Verify all properties pass consistently
    - Fix any failing properties

- [ ] 15. Final checkpoint - Complete integration verification
  - Ensure all tests pass, verify all features work end-to-end, confirm application is competition-ready. Ask the user if questions arise.

## Notes

- All tasks are required for comprehensive integration with property-based testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- The implementation follows an incremental approach: configuration → reads → WebSocket → transactions → optimization → polish
- All contract addresses and environment variables must be configured before starting implementation
- WebSocket server must be running on port 8080 for live feed integration
- Monad testnet RPC endpoint must be accessible for contract interactions
