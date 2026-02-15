'use client';

import { Sidebar } from './Sidebar';
import { LiveFeed } from './LiveFeed';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-claw-bg text-claw-text font-sans selection:bg-claw-red selection:text-white flex flex-col">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {/* Mobile Navigation */}
            <MobileNav />

            {/* Main Content Area */}
            <main className="flex-1 lg:pl-64 lg:pr-80 pt-[57px] lg:pt-0 transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    {children}
                </div>
            </main>

            {/* Desktop Live Feed - Hidden on mobile */}
            <div className="hidden lg:block">
                <LiveFeed />
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
}
