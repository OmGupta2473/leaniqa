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
    <div className="app-shell relative">
      {/* ── Desktop/tablet sidebar ── */}
      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      {/* ── Main content ── */}
      <main className="app-content relative min-h-screen">
        <Header />
        
        {/* Added bottom padding (pb-32) to ensure content clears the floating nav */}
        {children ? (
          <div className="pb-32">
            {children}
          </div>
        ) : (
          <div className="app-scroll pb-32">
            <Outlet />
          </div>
        )}

        {/* ── Mobile bottom nav ── */}
        <nav className="md:hidden">
          <BottomNav />
        </nav>
      </main>
    </div>
  );
}