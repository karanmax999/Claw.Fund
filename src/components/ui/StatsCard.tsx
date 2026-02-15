import { Card } from "./Card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string;
    subValue?: string;
    delta?: number;
    highlight?: boolean;
}

export function StatsCard({ label, value, subValue, delta, highlight }: StatsCardProps) {
    return (
        <Card className={cn(
            "flex flex-col gap-1 card-hover transition-all duration-300 hover:shadow-lg", 
            highlight && "border-claw-red/30 bg-claw-red/5 hover:border-claw-red/50 hover:bg-claw-red/10"
        )}>
            <span className="text-xs uppercase tracking-wider text-claw-dim font-mono">{label}</span>
            <div className="flex items-end justify-between">
                <span className={cn(
                    "text-2xl font-bold tracking-tight transition-colors", 
                    highlight ? "text-white" : "text-claw-text"
                )}>
                    {value}
                </span>
                {delta !== undefined && (
                    <div className={cn(
                        "flex items-center text-xs font-mono px-1.5 py-0.5 rounded transition-all",
                        delta >= 0 ? "text-claw-green bg-claw-green/10" : "text-red-500 bg-red-500/10"
                    )}>
                        {delta >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {Math.abs(delta)}%
                    </div>
                )}
            </div>
            {subValue && (
                <span className="text-xs text-claw-dim mt-1">{subValue}</span>
            )}
        </Card>
    );
}
