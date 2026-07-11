import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { BottomNav } from '@/shared/components/BottomNav';
import { Header } from '@/shared/components/Header';
import { ReactNode } from 'react';
import { useKeyboardOpen, useVisualViewport } from '@/shared/hooks/useVisualViewport';
import { motion, AnimatePresence } from 'motion/react';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isKeyboardOpen = useKeyboardOpen();
  const keyboardOffset = useVisualViewport();
  const location = useLocation();

  return (
    <div className="flex w-full min-h-screen bg-[var(--color-bg-base)]">
      {/* ── Desktop/tablet sidebar ── */}
      <aside className="hidden md:block w-[240px] flex-shrink-0">
        <Sidebar />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full">
        <Header />
        
        {children || (
          <div 
            className="flex-1 overflow-y-auto scroll-smooth" 
            style={{ 
              overscrollBehaviorY: 'contain',
              paddingBottom: isKeyboardOpen ? `${Math.max(keyboardOffset, 100)}px` : 'calc(100px + env(safe-area-inset-bottom))' 
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="h-full w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ── Mobile bottom nav ── */}
        {!isKeyboardOpen && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <BottomNav />
          </nav>
        )}
      </main>
    </div>
  );
}

