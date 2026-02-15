import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline';
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
    const variants = {
        default: "bg-claw-subtle border border-white/5 hover:border-white/10",
        glass: "glass-panel hover:bg-white/5",
        outline: "bg-transparent border border-claw-dim/20 hover:border-claw-dim/40"
    };

    return (
        <div
            className={cn(
                "rounded-xl p-6 relative overflow-hidden transition-all duration-300",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}
