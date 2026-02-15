import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monadTestnet } from './contracts';

export const wagmiConfig = getDefaultConfig({
  appName: 'CLAW.FUND',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [monadTestnet as any],
  ssr: true,
});
