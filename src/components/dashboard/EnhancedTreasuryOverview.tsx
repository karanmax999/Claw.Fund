import { StatsCard } from "../ui/StatsCard";
import { GlowCard } from "../ui/GlowCard";
import { AnimatedCounter } from "../ui/AnimatedCounter";
import { useTreasuryBalance, useTreasuryMaxAllocation, useTreasuryPaused } from "@/hooks/useContracts";
import { formatEther } from "viem";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Shield, Activity, Zap } from "lucide-react";

function TreasurySkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="h-32 bg-claw-card border border-white/5 rounded-lg animate-pulse"
                />
            ))}
        </div>
    );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 gap-4 mb-8"
        >
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
                <p className="text-red-500 font-mono text-sm mb-2">Failed to load treasury data</p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded text-xs font-mono transition-all hover:scale-105"
                >
                    RETRY
                </button>
            </div>
        </motion.div>
    );
}

export function EnhancedTreasuryOverview() {
    const { data: tvl, isLoading: tvlLoading, error: tvlError, refetch: refetchTvl } = useTreasuryBalance();
    const { data: maxAllocationBps, isLoading: maxAllocLoading } = useTreasuryMaxAllocation();
    const { data: isPaused } = useTreasuryPaused();
    const [pnl24h, setPnl24h] = useState<{ value: number; delta: number } | null>(null);
    const [pnlLoading, setPnlLoading] = useState(true);

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

    const tvlInEth = tvl && typeof tvl === 'bigint' ? formatEther(tvl) : '0';
    const tvlValue = parseFloat(tvlInEth);
    const maxAllocation = maxAllocationBps ? Number(maxAllocationBps) / 100 : 0;
    const pnl24hValue = pnl24h?.value ?? 0;
    const pnl24hDelta = pnl24h?.delta ?? 0;

    const cards = [
        {
            icon: TrendingUp,
            label: "Total Treasury Value",
            value: tvlValue,
            suffix: " MON",
            delta: pnl24hDelta,
            highlight: true,
            subValue: isPaused ? "⚠️ PAUSED" : "Active",
            glowColor: "#00FF94",
        },
        {
            icon: Activity,
            label: "24h PnL",
            value: pnl24hValue,
            suffix: " MON",
            delta: pnl24hDelta,
            glowColor: pnl24hValue >= 0 ? "#00FF94" : "#FF2E2E",
        },
        {
            icon: Zap,
            label: "Active Strategy",
            value: "MOMENTUM_ALPHA_V3",
            subValue: "Risk Level: AGGRESSIVE",
            isText: true,
            glowColor: "#FF2E2E",
        },
        {
            icon: Shield,
            label: "Max Allocation",
            value: maxAllocation,
            suffix: "%",
            subValue: `${maxAllocation}% per position`,
            glowColor: "#8B5CF6",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, index) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                    <GlowCard
                        glowColor={card.glowColor}
                        intensity="medium"
                        className="bg-claw-card border border-white/5 p-6 h-full"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <card.icon className="h-4 w-4 text-claw-dim" />
                                <span className="text-xs text-claw-dim uppercase tracking-wider">
                                    {card.label}
                                </span>
                            </div>
                            {card.highlight && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-2 h-2 bg-claw-green rounded-full shadow-[0_0_10px_#00FF94]"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            {card.isText ? (
                                <div className="text-xl font-bold font-mono text-white">
                                    {card.value}
                                </div>
                            ) : (
                                <div className="text-2xl font-bold font-mono text-white">
                                    <AnimatedCounter
                                        value={typeof card.value === 'number' ? card.value : 0}
                                        decimals={2}
                                        suffix={card.suffix || ''}
                                    />
                                </div>
                            )}

                            {card.delta !== undefined && card.delta !== 0 && (
                                <div className={`text-sm font-mono ${card.delta >= 0 ? 'text-claw-green' : 'text-red-500'}`}>
                                    {card.delta >= 0 ? '↑' : '↓'} {Math.abs(card.delta).toFixed(2)}%
                                </div>
                            )}

                            {card.subValue && (
                                <div className="text-xs text-claw-dim">
                                    {card.subValue}
                                </div>
                            )}
                        </div>
                    </GlowCard>
                </motion.div>
            ))}
        </div>
    );
}
