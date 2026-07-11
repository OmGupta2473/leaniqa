import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { BottomNav } from '@/shared/components/BottomNav';
import { Header } from '@/shared/components/Header';
import { ReactNode } from 'react';
import { useKeyboardOpen, useVisualViewport } from '@/shared/hooks/useVisualViewport';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isKeyboardOpen = useKeyboardOpen();
  const keyboardOffset = useVisualViewport();

  return (
    <div className="app-shell">
      {/* ── Desktop/tablet sidebar ── */}
      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      {/* ── Main content ── */}
      <main className="app-content">
        <Header />
        
        {children || (
          <div className="app-scroll" style={{ paddingBottom: isKeyboardOpen ? `${Math.max(keyboardOffset, 100)}px` : undefined }}>
            <Outlet />
          </div>
        )}

        {/* ── Mobile bottom nav ── */}
        {!isKeyboardOpen && (
          <nav className="app-bottom-nav">
            <BottomNav />
          </nav>
        )}
      </main>
    </div>
  );
}
