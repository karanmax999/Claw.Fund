import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Note: I'm implementing a simpler version without cva if I don't have it installed, 
// but since we are doing standard React, I'll just use standard props pattern for now to avoid extra deps if not needed.
// Actually, let's keep it simple and robust.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-claw-red/50 disabled:pointer-events-none disabled:opacity-50 active:scale-95";

        const variants = {
            primary: "bg-claw-red text-white hover:bg-red-600 shadow-[0_0_15px_rgba(255,46,46,0.3)] hover:shadow-[0_0_25px_rgba(255,46,46,0.5)]",
            secondary: "bg-claw-subtle text-white border border-white/10 hover:bg-white/5 hover:border-white/20",
            ghost: "hover:bg-white/5 text-claw-text hover:text-white",
            danger: "bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40"
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2",
            lg: "h-12 px-8 text-lg",
            icon: "h-10 w-10"
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : null}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"
