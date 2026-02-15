'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <motion.div
        className={cn('border-2 border-claw-red border-t-transparent rounded-full', sizeMap[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export function PulsingDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex h-3 w-3', className)}>
      <motion.span
        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-claw-red opacity-75"
        animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-claw-red" />
    </span>
  );
}

export function LoadingBar() {
  return (
    <div className="w-full h-1 bg-claw-subtle overflow-hidden rounded-full">
      <motion.div
        className="h-full bg-gradient-to-r from-claw-red via-claw-green to-claw-red"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{ width: '50%' }}
      />
    </div>
  );
}
