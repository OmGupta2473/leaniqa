import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { BottomNav } from '@/shared/components/BottomNav';
import { Header } from '@/shared/components/Header';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
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
          <div className="app-scroll">
            <Outlet />
          </div>
        )}

        {/* ── Mobile bottom nav ── */}
        <nav className="app-bottom-nav">
          <BottomNav />
        </nav>
      </main>
    </div>
  );
}
