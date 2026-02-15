'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { memo } from 'react';

// Memoize stat card to prevent unnecessary re-renders
const StatCard = memo(({ icon: Icon, value, label, color }: { 
  icon: any; 
  value: string; 
  label: string; 
  color: string;
}) => (
  <motion.div
    className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
    whileHover={{ scale: 1.02, borderColor: color }}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color === 'rgba(255, 46, 46, 0.3)' ? 'bg-claw-green/20' : color === 'rgba(139, 92, 246, 0.3)' ? 'bg-purple-500/20' : 'bg-claw-red/20'}`}>
        <Icon className={`h-5 w-5 ${color === 'rgba(255, 46, 46, 0.3)' ? 'text-claw-green' : color === 'rgba(139, 92, 246, 0.3)' ? 'text-purple-400' : 'text-claw-red'}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-claw-dim">{label}</div>
      </div>
    </div>
  </motion.div>
));

StatCard.displayName = 'StatCard';

export const HeroSection = memo(function HeroSection() {
  const { address } = useAccount();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-claw-red/20 via-purple-500/20 to-blue-500/20 border border-white/10 p-8 md:p-12 mb-8">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, #FF2E2E 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, #8B5CF6 0%, transparent 50%)',
            'radial-gradient(circle at 0% 100%, #3B82F6 0%, transparent 50%)',
            'radial-gradient(circle at 100% 0%, #FF2E2E 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Decorative CLAW icon */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 opacity-10 hidden lg:block">
        <motion.img
          src="/claw-logo.svg"
          alt=""
          className="w-64 h-64"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-claw-green/10 border border-claw-green/30 text-claw-green text-sm font-medium mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Autonomous Trading</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-claw-red to-purple-400 bg-clip-text text-transparent">
              Welcome to the Future
            </span>
            <br />
            <span className="text-white">of DeFi Trading</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-claw-dim max-w-2xl mb-8">
            Experience autonomous trading powered by advanced AI algorithms. 
            Maximize returns while minimizing risk with our battle-tested strategies.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard 
              icon={TrendingUp}
              value="+127%"
              label="All-Time Returns"
              color="rgba(255, 46, 46, 0.3)"
            />
            <StatCard 
              icon={Shield}
              value="$4.2M"
              label="Total Value Locked"
              color="rgba(139, 92, 246, 0.3)"
            />
            <StatCard 
              icon={Zap}
              value="1,247"
              label="Active Traders"
              color="rgba(0, 255, 148, 0.3)"
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            {!address ? (
              <motion.button
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-claw-red to-purple-500 text-white font-bold text-lg shadow-lg shadow-claw-red/30 flex items-center gap-2"
                whileHover={{ scale: 1.05, shadow: '0 20px 40px rgba(255, 46, 46, 0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            ) : (
              <Link href="/dashboard">
                <motion.button
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-claw-red to-purple-500 text-white font-bold text-lg shadow-lg shadow-claw-red/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>View Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            )}

            <motion.button
              className="px-8 py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-claw-red/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
    </div>
  );
});
