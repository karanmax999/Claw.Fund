'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Vote, ScrollText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/governance', label: 'Governance', icon: Vote },
  { href: '/quests', label: 'Quests', icon: ScrollText },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-claw-bg border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex-shrink-0">
              <img
                src="/claw-logo.svg"
                alt="CLAW.FUND Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tighter text-white">
              <span className="text-claw-red">CLAW</span>.FUND
            </h1>
          </Link>
          
          <div className="flex items-center gap-3">
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                if (!ready) return null;

                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      className="py-1.5 px-3 bg-claw-red/10 border border-claw-red/20 text-claw-red rounded text-xs font-mono"
                    >
                      CONNECT
                    </button>
                  );
                }

                return (
                  <div className="text-xs font-mono text-claw-text">
                    {account.displayName}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-claw-text hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-[57px] right-0 bottom-0 w-64 bg-claw-bg border-l border-white/5 z-40 overflow-y-auto"
            >
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors',
                        isActive
                          ? 'bg-claw-red/10 text-claw-red'
                          : 'text-claw-dim hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/5 mt-4">
                <div className="text-xs text-claw-dim flex items-center gap-2 mb-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-claw-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-claw-green"></span>
                  </span>
                  SYSTEM ONLINE
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
