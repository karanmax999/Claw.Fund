'use client';

import { ProposalList } from '@/components/governance/ProposalList';
import { Button } from '@/components/ui/Button';
import { Plus, Shield, Users, Vote } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { motion } from 'framer-motion';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function GovernancePage() {
    return (
        <motion.div 
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div 
                className="flex items-center justify-between"
                variants={item}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">GOVERNANCE_CONTROL</h2>
                        <p className="text-xs text-claw-dim font-mono mt-1">Manage treasury strategies and protocol parameters</p>
                    </div>
                </div>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button variant="primary">
                        <Plus className="h-4 w-4 mr-2" /> NEW_PROPOSAL
                    </Button>
                </motion.div>
            </motion.div>

            <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                variants={item}
            >
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <StatsCard label="VOTING_POWER" value="25,400 CLAW" subValue="Your Wallet" />
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <StatsCard label="TOTAL_DELEGATED" value="1.2M CLAW" subValue="Protocol Wide" />
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <StatsCard label="ACTIVE_PROPOSALS" value="1" subValue="Needs Action" highlight />
                </motion.div>
            </motion.div>

            <motion.div variants={item}>
                <div className="flex items-center gap-2 mb-4">
                    <Vote className="h-4 w-4 text-claw-green" />
                    <h3 className="text-sm font-mono text-claw-dim">PROPOSAL_QUEUE</h3>
                </div>
                <ProposalList />
            </motion.div>

            {/* Floating Governance Indicator */}
            <motion.div
                className="fixed bottom-6 right-6 bg-claw-subtle border border-blue-500/30 rounded-lg p-3 shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="flex items-center gap-2 text-xs font-mono">
                    <Users className="h-4 w-4 text-blue-500 animate-pulse" />
                    <span className="text-blue-500">DAO_ACTIVE</span>
                </div>
            </motion.div>
        </motion.div>
    );
}
