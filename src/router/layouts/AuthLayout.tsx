import { Outlet } from 'react-router-dom';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {children || <Outlet />}
    </div>
  );
}
