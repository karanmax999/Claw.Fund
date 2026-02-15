'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '../ui/Card';

const data = [
    { name: 'ETH', value: 45, color: '#627EEA' },
    { name: 'WBTC', value: 25, color: '#F7931A' },
    { name: 'USDC', value: 15, color: '#2775CA' },
    { name: 'MON', value: 10, color: '#8247E5' }, // Monad purple-ish
    { name: 'CLAW', value: 5, color: '#FF2E2E' },
];

export function AllocationChart() {
    return (
        <Card className="h-[350px] flex flex-col">
            <h3 className="text-sm font-mono text-claw-dim mb-4">ASSET_ALLOCATION</h3>
            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={450}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="stroke-claw-bg stroke-2 outline-none"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1F1F24',
                                borderRadius: '8px',
                                borderColor: 'rgba(255,255,255,0.1)',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ color: '#E0E0E0', fontSize: '12px', fontFamily: 'monospace' }}
                            cursor={false}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace', color: '#888888' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-xs text-claw-dim">TOTAL</div>
                        <div className="text-xl font-bold text-white">$4.2M</div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
