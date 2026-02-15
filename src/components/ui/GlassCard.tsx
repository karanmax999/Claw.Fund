'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  hover = true,
  glow = false,
  gradient = false 
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-xl backdrop-blur-xl border',
        gradient 
          ? 'bg-gradient-to-br from-white/10 via-white/5 to-transparent border-white/20'
          : 'bg-white/5 border-white/10',
        hover && 'transition-all duration-300',
        className
      )}
      whileHover={hover ? { 
        scale: 1.02,
        borderColor: 'rgba(255, 46, 46, 0.3)',
        boxShadow: glow ? '0 20px 40px rgba(255, 46, 46, 0.2)' : undefined
      } : undefined}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Glow effect */}
      {glow && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-claw-red/20 via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
      )}
    </motion.div>
  );
}

export function MetricCard({ 
  label, 
  value, 
  change, 
  icon: Icon,
  trend = 'up'
}: {
  label: string;
  value: string;
  change?: string;
  icon?: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-claw-green',
    down: 'text-red-500',
    neutral: 'text-claw-dim'
  };

  return (
    <GlassCard className="p-6 group" hover glow>
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-claw-dim uppercase tracking-wider">{label}</span>
        {Icon && (
          <motion.div
            className="p-2 rounded-lg bg-claw-red/20"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="h-4 w-4 text-claw-red" />
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        <motion.div
          className="text-3xl font-bold font-mono text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {value}
        </motion.div>

        {change && (
          <div className={cn('text-sm font-mono', trendColors[trend])}>
            {trend === 'up' && '↑ '}
            {trend === 'down' && '↓ '}
            {change}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
