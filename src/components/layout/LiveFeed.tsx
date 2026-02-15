'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Radio, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { env } from '@/lib/env';

export function LiveFeed() {
    const { events, connectionState, reconnect, reconnectAttempts } = useWebSocket(env.WS_URL);

    const getConnectionBadge = () => {
        switch (connectionState) {
            case 'connected':
                return <Badge variant="outline" className="text-[10px] text-claw-green">CONNECTED</Badge>;
            case 'connecting':
                return <Badge variant="outline" className="text-[10px] text-yellow-500">CONNECTING...</Badge>;
            case 'disconnected':
                return <Badge variant="outline" className="text-[10px] text-red-500">DISCONNECTED</Badge>;
            case 'failed':
                return <Badge variant="outline" className="text-[10px] text-red-500">FAILED</Badge>;
            case 'stopped':
                return <Badge variant="outline" className="text-[10px] text-gray-500">STOPPED</Badge>;
        }
    };

    const getExplorerLink = (txHash: string) => {
        return `https://explorer.monad.xyz/tx/${txHash}`;
    };

    return (
        <div className="w-80 h-screen border-l border-white/5 bg-claw-bg flex flex-col fixed right-0 top-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-mono text-sm text-claw-dim flex items-center gap-2">
                    <Radio className={`h-4 w-4 ${connectionState === 'connected' ? 'text-claw-green animate-pulse' : 'text-red-500'}`} />
                    LIVE_DECISION_FEED
                </h2>
                {getConnectionBadge()}
            </div>

            {(connectionState === 'disconnected' || connectionState === 'failed' || connectionState === 'stopped') && (
                <div className="p-4 bg-red-500/10 border-b border-red-500/30">
                    <p className="text-xs text-red-500 mb-2">
                        {connectionState === 'stopped' 
                            ? `Connection stopped after ${reconnectAttempts} attempts` 
                            : 'Connection lost'}
                    </p>
                    {connectionState !== 'stopped' && (
                        <button
                            onClick={reconnect}
                            className="text-[10px] px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded font-mono transition-colors"
                        >
                            RECONNECT
                        </button>
                    )}
                    {connectionState === 'stopped' && (
                        <button
                            onClick={reconnect}
                            className="text-[10px] px-2 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-500 rounded font-mono transition-colors"
                        >
                            RETRY CONNECTION
                        </button>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                <AnimatePresence initial={false}>
                    {events.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="p-3 border-l-2 border-l-claw-red bg-claw-subtle/50 hover:bg-claw-subtle transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${event.type === 'BUY' ? 'bg-claw-green/10 text-claw-green' : 'bg-red-500/10 text-red-500'}`}>
                                        {event.type} {event.token}
                                    </span>
                                    <span className="text-[10px] text-claw-dim font-mono">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                        <div className="text-[10px] text-claw-dim uppercase">Size</div>
                                        <div className="text-sm font-mono">{event.allocation}%</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-claw-dim uppercase">Conf</div>
                                        <div className="text-sm font-mono text-claw-red">{event.confidence}%</div>
                                    </div>
                                </div>

                                <div className="relative pl-3 border-l border-white/10">
                                    <p className="text-xs text-claw-dim italic leading-relaxed">
                                        "{event.reasoning}"
                                    </p>
                                </div>

                                {event.txHash && (
                                    <div className="mt-2 flex justify-end">
                                        <a 
                                            href={getExplorerLink(event.txHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-claw-dim hover:text-white flex items-center gap-1 transition-colors"
                                        >
                                            TX <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {events.length === 0 && (
                    <div className="text-center py-10 text-claw-dim text-xs font-mono animate-pulse">
                        WAITING_FOR_SIGNALS...
                    </div>
                )}
            </div>
        </div>
    );
}
