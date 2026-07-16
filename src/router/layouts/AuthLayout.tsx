import { Outlet } from 'react-router-dom';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="app-scroll min-h-[100dvh] overflow-y-auto w-full flex-1 bg-background-primary flex flex-col">
      {children || <Outlet />}
    </div>
  );
}
