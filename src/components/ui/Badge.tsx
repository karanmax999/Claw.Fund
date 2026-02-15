import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    const variants = {
        default: "bg-claw-subtle text-claw-text border-claw-dim/20",
        success: "bg-claw-green/10 text-claw-green border-claw-green/20 shadow-[0_0_10px_rgba(0,255,148,0.1)]",
        warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        error: "bg-claw-red/10 text-claw-red border-claw-red/20 text-shadow-red",
        outline: "border border-claw-dim/40 text-claw-dim"
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}
