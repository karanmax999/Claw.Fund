import { Card } from '../ui/Card';
import { ExternalLink } from 'lucide-react';

const mockTrades = [
    { id: 1, time: '10:42:05', token: 'ETH', action: 'BUY', size: '12.5%', price: '$2,850', tx: '0x3a...f9' },
    { id: 2, time: '10:15:30', token: 'WBTC', action: 'SELL', size: '5.0%', price: '$52,100', tx: '0x8b...2c' },
    { id: 3, time: '09:58:12', token: 'SOL', action: 'BUY', size: '8.2%', price: '$110', tx: '0x1c...a4' },
    { id: 4, time: '09:30:00', token: 'MON', action: 'BUY', size: '15.0%', price: '$0.85', tx: '0x7d...e1' },
    { id: 5, time: '09:12:45', token: 'USDC', action: 'REBALANCE', size: '2.5%', price: '$1.00', tx: '0x9e...b3' },
];

export function RecentTrades() {
    return (
        <Card className="flex flex-col">
            <h3 className="text-sm font-mono text-claw-dim mb-4">RECENT_EXECUTIONS</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/5 text-claw-dim font-mono text-xs">
                            <th className="pb-3 pl-2">TIME</th>
                            <th className="pb-3">TOKEN</th>
                            <th className="pb-3">ACTION</th>
                            <th className="pb-3">SIZE</th>
                            <th className="pb-3">PRICE</th>
                            <th className="pb-3 pr-2 text-right">TX</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockTrades.map((trade) => (
                            <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                <td className="py-3 pl-2 font-mono text-claw-dim text-xs">{trade.time}</td>
                                <td className="py-3 font-bold">{trade.token}</td>
                                <td className="py-3">
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${trade.action === 'BUY' ? 'bg-claw-green/10 text-claw-green' :
                                            trade.action === 'SELL' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {trade.action}
                                    </span>
                                </td>
                                <td className="py-3 font-mono text-claw-text">{trade.size}</td>
                                <td className="py-3 text-claw-dim">{trade.price}</td>
                                <td className="py-3 pr-2 text-right">
                                    <a href="#" className="inline-flex items-center text-xs text-claw-dim hover:text-claw-red transition-colors">
                                        {trade.tx} <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
