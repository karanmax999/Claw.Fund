'use client';

import { useAccount, useReadContract } from 'wagmi';
import { Card } from './Card';
import { Lock, Wallet } from 'lucide-react';
import { Button } from './Button';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';

// Mock CLAW Token Address (Replace with real one)
const CLAW_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

// Minimal ERC20 ABI
const erc20Abi = [
    {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
    },
] as const;

interface TokenGateProps {
    children: React.ReactNode;
    threshold: number; // Amount of CLAW tokens required
    title?: string;
    description?: string;
}

export function TokenGate({
    children,
    threshold,
    title = "PRO_ANALYTICS_LOCKED",
    description = `Hold ≥ ${threshold} $CLAW to access this real-time data stream.`
}: TokenGateProps) {
    const { address, isConnected } = useAccount();

    // For Hackathon/Demo purposes, we can simulate balance if contract read fails 
    // or just assume 0 if not connected.
    // We'll try to read real contract, but fall back to a mock value for demo if needed.

    const { data: balance } = useReadContract({
        address: CLAW_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        }
    });

    // MOCK LOGIC FOR DEMO: 
    // If we are connected, let's pretend we have 1000 tokens for now 
    // UNLESS the prompt explicitly asked for real read only.
    // "Fetch balance via ERC20 read." -> We implemented the read.
    // "If user balance < threshold: Blur content"

    // Real logic:
    // const userBalance = balance ? parseFloat(formatEther(balance)) : 0;

    // Demo logic (since we don't have the token deployed on localhost):
    // We'll pass if connected for now to show the UI working, 
    // OR we can default to 0 to show the lock state.
    // Let's default to 0 (Locked) to demonstrate the feature as requested.
    const userBalance = balance ? parseFloat(formatEther(balance)) : 0;

    const hasAccess = isConnected && userBalance >= threshold;

    if (hasAccess) {
        return <>{children}</>;
    }

    return (
        <div className="relative group overflow-hidden rounded-xl">
            {/* Blurred Content Background */}
            <div className="filter blur-md opacity-20 pointer-events-none select-none" aria-hidden="true">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-sm border border-white/5 rounded-xl">
                <div className="p-3 bg-claw-subtle rounded-full mb-4 border border-white/10 shadow-[0_0_15px_rgba(255,46,46,0.1)]">
                    <Lock className="h-6 w-6 text-claw-red" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2 font-mono tracking-tight uppercase">
                    {title}
                </h3>

                <p className="text-claw-dim text-sm max-w-sm mb-6">
                    {description}
                </p>

                {!isConnected ? (
                    <div className="scale-90">
                        <ConnectButton />
                    </div>
                ) : (
                    <Button variant="secondary" className="cursor-not-allowed opacity-80">
                        <Wallet className="h-4 w-4 mr-2" />
                        BALANCE: {userBalance.toFixed(2)} CLAW
                    </Button>
                )}

                <div className="mt-4 text-[10px] text-claw-dim font-mono">
                    REQUIRED: {threshold} CLAW
                </div>
            </div>
        </div>
    );
}
