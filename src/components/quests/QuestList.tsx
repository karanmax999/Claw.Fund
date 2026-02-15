'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Check, Lock } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    useQuestCount, 
    useQuest, 
    useCompleteQuest, 
    useHasCompletedQuest,
    useCLAWBalance 
} from '@/hooks/useContracts';
import { CONTRACTS, QuestManagerABI } from '@/lib/contracts';
import { formatEther } from 'viem';

const MIN_QUEST_TOKENS = 10n * 10n ** 18n; // 10 CLAW tokens to access quests

export function QuestList() {
    const { address } = useAccount();
    const { data: questCount } = useQuestCount();
    const { data: clawBalance } = useCLAWBalance(address);
    const [questIds, setQuestIds] = useState<bigint[]>([]);

    // Generate quest IDs array
    useEffect(() => {
        if (questCount) {
            const count = Number(questCount);
            const ids = Array.from({ length: count }, (_, i) => BigInt(i + 1));
            setQuestIds(ids);
        }
    }, [questCount]);

    const canAccessQuests = clawBalance && typeof clawBalance === 'bigint' && clawBalance >= MIN_QUEST_TOKENS;

    if (!questCount || Number(questCount) === 0) {
        return (
            <Card className="p-8 text-center">
                <p className="text-claw-dim font-mono text-sm">No quests available yet</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {!canAccessQuests && address && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                        <p className="text-yellow-500 text-sm font-mono">
                            ⚠️ You need at least {Number(MIN_QUEST_TOKENS) / 1e18} CLAW tokens to access quests. 
                            Current balance: {clawBalance ? (Number(clawBalance) / 1e18).toFixed(2) : '0'} CLAW
                        </p>
                    </Card>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {questIds.map((questId, index) => (
                    <motion.div
                        key={questId.toString()}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.08 }}
                    >
                        <QuestCard
                            questId={questId}
                            canAccess={!!canAccessQuests}
                            userAddress={address}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function QuestCard({ 
    questId, 
    canAccess, 
    userAddress 
}: { 
    questId: bigint; 
    canAccess: boolean;
    userAddress?: `0x${string}`;
}) {
    const { data: quest } = useQuest(questId);
    const { data: hasCompleted } = useHasCompletedQuest(questId, userAddress);
    const { writeContract, isPending } = useCompleteQuest();

    const handleCompleteQuest = async () => {
        if (!canAccess) {
            alert(`You need at least ${Number(MIN_QUEST_TOKENS) / 1e18} CLAW tokens to complete quests`);
            return;
        }

        try {
            await writeContract({
                address: CONTRACTS.QuestManager as `0x${string}`,
                abi: QuestManagerABI,
                functionName: 'verifyAndClaimQuest',
                args: [questId],
            });
        } catch (error) {
            console.error('Quest completion failed:', error);
        }
    };

    if (!quest) {
        return (
            <Card className="p-4 animate-pulse">
                <div className="h-40 bg-claw-subtle rounded" />
            </Card>
        );
    }

    // Type guard for quest data
    const questData = quest as any;
    const status = hasCompleted ? 'COMPLETED' : 
                   !questData.active ? 'LOCKED' : 
                   !canAccess ? 'LOCKED' : 'AVAILABLE';

    const rewardAmount = questData.reward ? (Number(questData.reward) / 1e18).toFixed(0) : '0';

    return (
        <motion.div
            whileHover={{ scale: status !== 'LOCKED' ? 1.03 : 1 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <Card
                className={`flex flex-col h-full ${status === 'LOCKED' ? 'opacity-50 grayscale' : ''}`}
            >
                <div className="flex justify-between items-start mb-4">
                    <motion.div 
                        className={`p-2 rounded-lg ${status === 'COMPLETED' ? 'bg-claw-green/20 text-claw-green' : 'bg-claw-red/20 text-claw-red'}`}
                        animate={status === 'AVAILABLE' ? { 
                            rotate: [0, -10, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1.1, 1]
                        } : {}}
                        transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            repeatDelay: 3 
                        }}
                    >
                        <Trophy className="h-6 w-6" />
                    </motion.div>
                    <Badge variant={
                        status === 'COMPLETED' ? 'success' :
                        status === 'LOCKED' ? 'outline' : 'warning'
                    }>
                        {status}
                    </Badge>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                    Quest #{questId.toString()}
                </h3>
                <p className="text-sm text-claw-dim mb-4 flex-1">
                    {questData.description || 'Complete this quest to earn rewards'}
                </p>

                <div className="mt-auto space-y-3">
                    <motion.div 
                        className="p-2 bg-claw-bg rounded border border-white/5 text-xs font-mono text-center text-claw-green"
                        whileHover={{ scale: 1.05 }}
                    >
                        REWARD: {rewardAmount} CLAW
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: status !== 'LOCKED' && status !== 'COMPLETED' ? 1.05 : 1 }}
                        whileTap={{ scale: status !== 'LOCKED' && status !== 'COMPLETED' ? 0.95 : 1 }}
                    >
                        <Button
                            className="w-full"
                            variant={status === 'COMPLETED' ? 'secondary' : 'primary'}
                            disabled={status === 'LOCKED' || status === 'COMPLETED' || isPending}
                            onClick={handleCompleteQuest}
                        >
                            {status === 'COMPLETED' ? (
                                <><Check className="h-4 w-4 mr-2" /> CLAIMED</>
                            ) : status === 'LOCKED' ? (
                                <><Lock className="h-4 w-4 mr-2" /> LOCKED</>
                            ) : isPending ? (
                                'VERIFYING...'
                            ) : (
                                'VERIFY & CLAIM'
                            )}
                        </Button>
                    </motion.div>
                </div>
            </Card>
        </motion.div>
    );
}
