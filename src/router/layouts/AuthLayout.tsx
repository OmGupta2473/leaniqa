import { Outlet } from 'react-router-dom';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] w-full flex-1 bg-background-primary flex flex-col">
      {children || <Outlet />}
    </div>
  );
}
