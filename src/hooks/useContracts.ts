import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { 
  CONTRACTS, 
  AgentTreasuryABI, 
  GovernanceABI, 
  CLAWTokenABI,
  QuestManagerABI 
} from '@/lib/contracts';

// Treasury hooks
export function useTreasuryBalance() {
  return useReadContract({
    address: CONTRACTS.AgentTreasury as `0x${string}`,
    abi: AgentTreasuryABI,
    functionName: 'totalTreasuryValue',
  });
}

export function useTreasuryHoldings() {
  // Note: This will need to be implemented based on the actual contract structure
  // The AgentTreasury contract doesn't have a getHoldings function in the ABI
  // We'll need to query individual token balances
  return useReadContract({
    address: CONTRACTS.AgentTreasury as `0x${string}`,
    abi: AgentTreasuryABI,
    functionName: 'nativeBalance',
  });
}

export function useTreasuryPaused() {
  return useReadContract({
    address: CONTRACTS.AgentTreasury as `0x${string}`,
    abi: AgentTreasuryABI,
    functionName: 'paused',
  });
}

export function useTreasuryMaxAllocation() {
  return useReadContract({
    address: CONTRACTS.AgentTreasury as `0x${string}`,
    abi: AgentTreasuryABI,
    functionName: 'maxAllocationBps',
  });
}

// Governance hooks
export function useProposalCount() {
  return useReadContract({
    address: CONTRACTS.Governance as `0x${string}`,
    abi: GovernanceABI,
    functionName: 'proposalCount',
  });
}

export function useProposal(proposalId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.Governance as `0x${string}`,
    abi: GovernanceABI,
    functionName: 'getProposal',
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined },
  });
}

export function useVotingPeriod() {
  return useReadContract({
    address: CONTRACTS.Governance as `0x${string}`,
    abi: GovernanceABI,
    functionName: 'votingPeriod',
  });
}

export function useMinProposalTokens() {
  return useReadContract({
    address: CONTRACTS.Governance as `0x${string}`,
    abi: GovernanceABI,
    functionName: 'minProposalTokens',
  });
}

export function useHasVoted(proposalId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.Governance as `0x${string}`,
    abi: GovernanceABI,
    functionName: 'hasVoted',
    args: proposalId !== undefined && address ? [proposalId, address] : undefined,
    query: { enabled: proposalId !== undefined && !!address },
  });
}

export function useVoteOnProposal() {
  return useWriteContract();
}

export function useCreateProposal() {
  return useWriteContract();
}

// Token balance hook
export function useCLAWBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.CLAWToken as `0x${string}`,
    abi: CLAWTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useCLAWTotalSupply() {
  return useReadContract({
    address: CONTRACTS.CLAWToken as `0x${string}`,
    abi: CLAWTokenABI,
    functionName: 'totalSupply',
  });
}

// Quest hooks
export function useQuestCount() {
  return useReadContract({
    address: CONTRACTS.QuestManager as `0x${string}`,
    abi: QuestManagerABI,
    functionName: 'questCount',
  });
}

export function useQuest(questId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.QuestManager as `0x${string}`,
    abi: QuestManagerABI,
    functionName: 'getQuest',
    args: questId !== undefined ? [questId] : undefined,
    query: { enabled: questId !== undefined },
  });
}

export function useHasCompletedQuest(questId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.QuestManager as `0x${string}`,
    abi: QuestManagerABI,
    functionName: 'hasCompleted',
    args: questId !== undefined && address ? [questId, address] : undefined,
    query: { enabled: questId !== undefined && !!address },
  });
}

export function useCompleteQuest() {
  return useWriteContract();
}

export function useCreateQuest() {
  return useWriteContract();
}

// Helper function to get all proposals
export function useAllProposals() {
  const { data: proposalCount } = useProposalCount();
  
  // Generate array of proposal IDs to fetch
  const proposalIds = proposalCount ? Array.from({ length: Number(proposalCount) }, (_, i) => BigInt(i + 1)) : [];
  
  return proposalIds;
}

// Helper function to get all quests
export function useAllQuests() {
  const { data: questCount } = useQuestCount();
  
  // Generate array of quest IDs to fetch
  const questIds = questCount ? Array.from({ length: Number(questCount) }, (_, i) => BigInt(i + 1)) : [];
  
  return questIds;
}
