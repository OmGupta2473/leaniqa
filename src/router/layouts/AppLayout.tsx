import React, { Profiler } from 'react';
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { BottomNav } from '@/shared/components/BottomNav';
import { Header } from '@/shared/components/Header';
import { ReactNode } from 'react';
import { useKeyboardOpen, useVisualViewport } from '@/shared/hooks/useVisualViewport';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useRenderTracker('AppLayout');
  const isKeyboardOpen = useKeyboardOpen();
  const keyboardOffset = useVisualViewport();
  const location = useLocation();

  return (
    <Profiler id="AppLayout" onRender={onRenderCallback}>
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
            <div className="flex flex-col min-h-full w-full">
              <Outlet />
            </div>
          </div>
        )}

        {/* ── Mobile bottom nav ── */}
        {!isKeyboardOpen && location.pathname !== '/onboarding' && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <BottomNav />
          </nav>
        )}
      </main>
    </div>
  </Profiler>
  );
}

