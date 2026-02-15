'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TestnetBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-yellow-500/10 border-b border-yellow-500/30"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-yellow-500 font-semibold">Testnet Mode:</span>
                <span className="text-yellow-500/80 ml-2">
                  This is running on Monad Testnet. Do not use real funds.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-yellow-500/60 hover:text-yellow-500 transition-colors"
              aria-label="Close banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
