'use client';

import { QuestList } from '@/components/quests/QuestList';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap } from 'lucide-react';

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

export default function QuestsPage() {
    return (
        <motion.div 
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative bg-gradient-to-br from-yellow-500 to-orange-500 p-2 rounded-lg">
                            <Trophy className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">DEGEN_QUESTS</h2>
                        <p className="text-xs text-claw-dim font-mono mt-1">Complete on-chain tasks to earn rewards and reputation</p>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={item}>
                <QuestList />
            </motion.div>

            {/* Floating Quest Indicator */}
            <motion.div
                className="fixed bottom-6 right-6 bg-claw-subtle border border-yellow-500/30 rounded-lg p-3 shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center gap-2 text-xs font-mono">
                    <Target className="h-4 w-4 text-yellow-500 animate-pulse" />
                    <span className="text-yellow-500">QUESTS_LIVE</span>
                </div>
            </motion.div>
        </motion.div>
    );
}
