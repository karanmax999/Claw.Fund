import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-claw-bg mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6">
              <img
                src="/claw-logo.svg"
                alt="CLAW.FUND Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-sm text-claw-dim">
              © 2026 CLAW.FUND. Built on Monad Testnet.
            </div>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link 
              href="/terms" 
              className="text-claw-dim hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/privacy" 
              className="text-claw-dim hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <a 
              href="https://github.com/claw-fund" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-claw-dim hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
