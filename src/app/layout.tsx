import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { TestnetBanner } from '@/components/ui/TestnetBanner';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';

import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif']
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
  preload: true,
  fallback: ['monospace']
});

export const metadata: Metadata = {
  title: 'CLAW.FUND | AI-Powered Autonomous Trading Fund',
  description: 'Autonomous on-chain trading fund powered by AI. Trade, govern, and earn on Monad.',
  keywords: ['DeFi', 'AI Trading', 'Autonomous Fund', 'Monad', 'Blockchain', 'Cryptocurrency'],
  authors: [{ name: 'CLAW.FUND Team' }],
  icons: {
    icon: '/claw-logo.png',
    apple: '/claw-logo.png',
  },
  openGraph: {
    title: 'CLAW.FUND | AI-Powered Autonomous Trading Fund',
    description: 'Autonomous on-chain trading fund powered by AI',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CLAW.FUND - AI-Powered Autonomous Trading Fund',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CLAW.FUND',
    description: 'AI-Powered Autonomous Trading Fund on Monad',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-claw-bg text-claw-text`}>
        <ErrorBoundary>
          <ToastProvider>
            <Providers>
              <WebVitalsReporter />
              <TestnetBanner />
              <AppShell>
                {children}
              </AppShell>
            </Providers>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
