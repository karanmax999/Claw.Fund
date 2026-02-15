import { StatsCard } from "../ui/StatsCard";
import { useTreasuryBalance, useTreasuryMaxAllocation, useTreasuryPaused } from "@/hooks/useContracts";
import { formatEther } from "viem";
import { useEffect, useState } from "react";

// Skeleton loader component
function TreasurySkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-claw-card border border-white/5 rounded-lg animate-pulse" />
            ))}
        </div>
    );
}

// Error card component
function ErrorCard({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-500 font-mono text-sm mb-2">Failed to load treasury data</p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded text-xs font-mono transition-colors"
                >
                    RETRY
                </button>
            </div>
        </div>
    );
}

export function TreasuryOverview() {
    const { data: tvl, isLoading: tvlLoading, error: tvlError, refetch: refetchTvl } = useTreasuryBalance();
    const { data: maxAllocationBps, isLoading: maxAllocLoading } = useTreasuryMaxAllocation();
    const { data: isPaused } = useTreasuryPaused();
    const [pnl24h, setPnl24h] = useState<{ value: number; delta: number } | null>(null);
    const [pnlLoading, setPnlLoading] = useState(true);

    // Fetch 24h PnL from backend API
    useEffect(() => {
        async function fetch24hPnL() {
            try {
                const response = await fetch('/api/performance/24h');
                if (response.ok) {
                    const data = await response.json();
                    setPnl24h(data);
                }
            } catch (error) {
                console.error('Failed to fetch 24h PnL:', error);
            } finally {
                setPnlLoading(false);
            }
        }
        fetch24hPnL();
    }, []);

    const isLoading = tvlLoading || maxAllocLoading || pnlLoading;
    const hasError = tvlError;

    if (isLoading) return <TreasurySkeleton />;
    if (hasError) return <ErrorCard onRetry={refetchTvl} />;

    // Format TVL
    const tvlInEth = tvl && typeof tvl === 'bigint' ? formatEther(tvl) : '0';
    const tvlFormatted = `${parseFloat(tvlInEth).toFixed(2)} MON`;
    
    // Calculate risk utilization (placeholder - would need actual position data)
    const maxAllocation = maxAllocationBps ? Number(maxAllocationBps) / 100 : 0;
    const riskUtilization = maxAllocation > 0 ? `${maxAllocation}%` : 'N/A';

    // Format 24h PnL
    const pnl24hValue = pnl24h?.value ?? 0;
    const pnl24hDelta = pnl24h?.delta ?? 0;
    const pnl24hFormatted = pnl24hValue >= 0 ? `+${pnl24hValue.toFixed(2)} MON` : `${pnl24hValue.toFixed(2)} MON`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
                label="Total Treasury Value"
                value={tvlFormatted}
                delta={pnl24hDelta}
                highlight
                subValue={isPaused ? "⚠️ PAUSED" : "Active"}
            />
            <StatsCard
                label="24h PnL"
                value={pnl24hFormatted}
                delta={pnl24hDelta}
            />
            <StatsCard
                label="Active Strategy"
                value="MOMENTUM_ALPHA_V3"
                subValue="Risk Level: AGGRESSIVE"
            />
            <StatsCard
                label="Max Allocation"
                value={riskUtilization}
                subValue={`${maxAllocation}% per position`}
            />
        </div>
    );
}
