'use client';

import { HeroSection } from '@/components/dashboard/HeroSection';
import { EnhancedTreasuryOverview } from '@/components/dashboard/EnhancedTreasuryOverview';
import { TokenGate } from '@/components/ui/TokenGate';
import { ParticleBackground } from '@/components/ui/ParticleBackground';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState, lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load heavy components
const AllocationChart = lazy(() => import('@/components/dashboard/AllocationChart').then(m => ({ default: m.AllocationChart })));
const PerformanceChart = lazy(() => import('@/components/dashboard/PerformanceChart').then(m => ({ default: m.PerformanceChart })));
const RecentTrades = lazy(() => import('@/components/dashboard/RecentTrades').then(m => ({ default: m.RecentTrades })));

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// Loading fallback component
function ChartSkeleton() {
    return (
        <div className="bg-claw-subtle rounded-xl p-6 animate-pulse">
            <div className="h-64 bg-claw-bg rounded" />
        </div>
    );
}

export default function DashboardPage() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            {/* Particle Background */}
            <ParticleBackground />

            <motion.div 
                className="space-y-8 relative z-10"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* Hero Section */}
                <motion.div variants={item}>
                    <HeroSection />
                </motion.div>

                {/* Enhanced Header */}
                <motion.div 
                    className="flex items-center justify-between"
                    variants={item}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-claw-red/20 blur-xl rounded-full animate-pulse" />
                            <div className="relative bg-gradient-to-br from-claw-red to-red-600 p-2 rounded-lg">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                DASHBOARD_OVERVIEW
                                <span className="inline-flex items-center gap-1 text-xs font-mono text-claw-green bg-claw-green/10 px-2 py-1 rounded border border-claw-green/30">
                                    <Zap className="h-3 w-3" />
                                    LIVE
                                </span>
                            </h2>
                            <p className="text-xs text-claw-dim font-mono mt-1">
                                Real-time autonomous trading intelligence
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-mono text-claw-dim bg-claw-subtle px-3 py-1.5 rounded border border-white/5">
                            {time.toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] font-mono text-claw-dim/60">
                            MONAD_TESTNET
                        </span>
                    </div>
                </motion.div>

                {/* Enhanced Treasury Overview */}
                <motion.div variants={item}>
                    <EnhancedTreasuryOverview />
                </motion.div>

                {/* Charts Grid with Stagger - Lazy Loaded */}
                <motion.div 
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    variants={item}
                >
                    <motion.div 
                        className="lg:col-span-2"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Suspense fallback={<ChartSkeleton />}>
                            <TokenGate 
                                threshold={100} 
                                title="PRO_CHART_LOCKED" 
                                description="Hold 100 CLAW to view real-time performance metrics."
                            >
                                <PerformanceChart />
                            </TokenGate>
                        </Suspense>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Suspense fallback={<ChartSkeleton />}>
                            <AllocationChart />
                        </Suspense>
                    </motion.div>
                </motion.div>

                {/* Recent Trades with Animation - Lazy Loaded */}
                <motion.div variants={item}>
                    <Suspense fallback={<ChartSkeleton />}>
                        <RecentTrades />
                    </Suspense>
                </motion.div>

                {/* Floating Stats Indicator */}
                <motion.div
                    className="fixed bottom-6 right-6 bg-claw-subtle border border-claw-green/30 rounded-lg p-3 shadow-lg backdrop-blur-sm z-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center gap-2 text-xs font-mono">
                        <TrendingUp className="h-4 w-4 text-claw-green animate-pulse" />
                        <span className="text-claw-green">SYSTEM_ACTIVE</span>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
