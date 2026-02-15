'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Vote, ScrollText, TrendingUp, Shield, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { useCLAWBalance } from '@/hooks/useContracts';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { href: '/governance', label: 'Governance', icon: Vote, badge: 'Pro' },
    { href: '/quests', label: 'Quests', icon: ScrollText, badge: 'New' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { address } = useAccount();
    const { data: clawBalance } = useCLAWBalance(address);

    const balance = clawBalance && typeof clawBalance === 'bigint' ? parseFloat(formatEther(clawBalance)) : 0;

    return (
        <div className="w-64 h-screen border-r border-white/5 bg-gradient-to-b from-claw-bg via-claw-bg to-claw-subtle/30 flex flex-col fixed left-0 top-0 backdrop-blur-xl">
            {/* Logo Section with Glow */}
            <div className="p-6 border-b border-white/5">
                <Link href="/dashboard" className="flex items-center gap-3 group relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-claw-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative w-10 h-10 flex-shrink-0">
                        <motion.img
                            src="/claw-logo.svg"
                            alt="CLAW.FUND Logo"
                            className="w-full h-full object-contain"
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                        />
                    </div>
                    <div className="relative">
                        <h1 className="text-2xl font-bold tracking-tighter text-white">
                            <span className="text-claw-red">CLAW</span>.FUND
                        </h1>
                        <div className="text-xs text-claw-dim flex items-center gap-2">
                            <motion.span 
                                className="relative flex h-2 w-2"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-claw-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-claw-green"></span>
                            </motion.span>
                            <span className="font-mono">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Balance Card */}
            {address && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mt-4 p-4 bg-gradient-to-br from-claw-red/10 to-purple-500/10 border border-claw-red/20 rounded-lg backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-claw-dim uppercase tracking-wider">Your Balance</span>
                        <Zap className="h-3 w-3 text-claw-red" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                        {balance.toFixed(2)}
                        <span className="text-sm text-claw-dim ml-1">CLAW</span>
                    </div>
                    <div className="mt-2 h-1 bg-claw-subtle rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-claw-red to-claw-green"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((balance / 1000) * 100, 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="mt-1 text-xs text-claw-dim">
                        {balance >= 100 ? '✓ Pro Access' : `${(100 - balance).toFixed(0)} more for Pro`}
                    </div>
                </motion.div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-claw-red/20 to-purple-500/20 text-white border border-claw-red/30 shadow-lg shadow-claw-red/20"
                                        : "text-claw-dim hover:text-white hover:bg-white/5 border border-transparent"
                                )}
                            >
                                {/* Active indicator line */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-claw-red to-purple-500 rounded-r"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}

                                {/* Icon with animation */}
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                >
                                    <Icon className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive ? "text-claw-red" : "group-hover:text-white"
                                    )} />
                                </motion.div>

                                <span className="flex-1">{item.label}</span>

                                {/* Badge */}
                                {item.badge && (
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                        item.badge === 'Pro' 
                                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                            : "bg-claw-green/20 text-claw-green border border-claw-green/30"
                                    )}>
                                        {item.badge}
                                    </span>
                                )}

                                {/* Arrow indicator */}
                                {isActive && (
                                    <motion.div
                                        initial={{ x: -5, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <ChevronRight className="h-4 w-4 text-claw-red" />
                                    </motion.div>
                                )}

                                {/* Hover glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-claw-red/0 via-claw-red/5 to-claw-red/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </Link>
                        </motion.div>
                    );
                })}

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                    <div className="px-4">
                        <div className="text-xs text-claw-dim uppercase tracking-wider mb-3">Quick Stats</div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-claw-subtle/30 hover:bg-claw-subtle/50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-claw-green" />
                                    <span className="text-xs text-claw-dim">24h PnL</span>
                                </div>
                                <span className="text-xs font-mono text-claw-green">+3.2%</span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg bg-claw-subtle/30 hover:bg-claw-subtle/50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-3 w-3 text-purple-400" />
                                    <span className="text-xs text-claw-dim">Risk Level</span>
                                </div>
                                <span className="text-xs font-mono text-purple-400">MEDIUM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Wallet Connection */}
            <div className="p-4 border-t border-white/5 space-y-3 bg-claw-subtle/20">
                <ConnectButton.Custom>
                    {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        mounted,
                    }) => {
                        const ready = mounted;
                        const connected = ready && account && chain;

                        if (!ready) {
                            return (
                                <div
                                    aria-hidden="true"
                                    style={{ opacity: 0, pointerEvents: 'none', userSelect: 'none' }}
                                />
                            );
                        }

                        if (!connected) {
                            return (
                                <motion.button
                                    onClick={openConnectModal}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-claw-red to-purple-500 hover:from-claw-red/80 hover:to-purple-500/80 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-claw-red/20 hover:shadow-claw-red/40"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        CONNECT WALLET
                                    </span>
                                </motion.button>
                            );
                        }

                        return (
                            <div className="space-y-2">
                                <motion.button
                                    onClick={openChainModal}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-claw-subtle border border-white/10 hover:border-white/20 text-xs text-claw-text transition-all"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div className="flex items-center gap-2">
                                        {chain.hasIcon && (
                                            <div
                                                style={{
                                                    background: chain.iconBackground,
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 999,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {chain.iconUrl && (
                                                    <img
                                                        alt={chain.name ?? 'Chain icon'}
                                                        src={chain.iconUrl}
                                                        style={{ width: 16, height: 16 }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <span>{chain.name}</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-claw-dim" />
                                </motion.button>

                                <motion.button
                                    onClick={openAccountModal}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-claw-red/10 to-purple-500/10 border border-claw-red/20 hover:border-claw-red/40 text-xs font-mono text-claw-text transition-all"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <span className="truncate">{account.displayName}</span>
                                    {account.displayBalance && (
                                        <span className="text-claw-green ml-2">{account.displayBalance}</span>
                                    )}
                                </motion.button>
                            </div>
                        );
                    }}
                </ConnectButton.Custom>
            </div>
        </div>
    );
}
