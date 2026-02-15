'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card } from '../ui/Card';

const data = [
    { time: '00:00', value: 4000000 },
    { time: '04:00', value: 4050000 },
    { time: '08:00', value: 4020000 },
    { time: '12:00', value: 4150000 },
    { time: '16:00', value: 4200000 },
    { time: '20:00', value: 4250000 },
    { time: '24:00', value: 4284932 },
];

export function PerformanceChart() {
    return (
        <Card className="h-[350px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-mono text-claw-dim">PERFORMANCE_HISTORY (24H)</h3>
                <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 bg-white/5 rounded text-white cursor-pointer hover:bg-white/10">1D</span>
                    <span className="text-xs px-2 py-1 text-claw-dim cursor-pointer hover:text-white">1W</span>
                    <span className="text-xs px-2 py-1 text-claw-dim cursor-pointer hover:text-white">1M</span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00FF94" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#00FF94" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#888888"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1F1F24',
                                borderRadius: '8px',
                                borderColor: 'rgba(255,255,255,0.1)',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ color: '#00FF94', fontSize: '12px', fontFamily: 'monospace' }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#00FF94"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
