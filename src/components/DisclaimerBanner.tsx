'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('disclaimer-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('disclaimer-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/10 border-b border-yellow-500/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-500">
            <span className="font-semibold">Testnet Only:</span> This is experimental software. 
            Do not use real funds. All transactions are on Monad Testnet.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-yellow-500/20 rounded transition-colors"
          aria-label="Dismiss disclaimer"
        >
          <X className="h-4 w-4 text-yellow-500" />
        </button>
      </div>
    </div>
  );
}
