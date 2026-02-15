// Contract addresses from deployment JSON
export const CONTRACTS = {
  CLAWToken: '0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD',
  AgentTreasury: '0xA32CB983689376b8FED765727067069084d1fbb6',
  Governance: '0x6726a4A8B149F59Db599FEBF450F279e82951560',
  ProfitDistributor: '0x4256b955d4Bf234e484c9A6145F901833881c9e2',
  QuestManager: '0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f'
} as const;

// Import ABIs
import CLAWTokenABI from '../../contracts/abi/CLAWToken.json';
import AgentTreasuryABI from '../../contracts/abi/AgentTreasury.json';
import GovernanceABI from '../../contracts/abi/Governance.json';
import ProfitDistributorABI from '../../contracts/abi/ProfitDistributor.json';
import QuestManagerABI from '../../contracts/abi/QuestManager.json';

export {
  CLAWTokenABI,
  AgentTreasuryABI,
  GovernanceABI,
  ProfitDistributorABI,
  QuestManagerABI
};

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
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || ''] },
    public: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || ''] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
  testnet: true,
} as const;
