import { Outlet } from 'react-router-dom';
import { ReactNode } from 'react';
import { useKeyboardOpen, useVisualViewport } from '@/shared/hooks/useVisualViewport';

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const isKeyboardOpen = useKeyboardOpen();
  const keyboardOffset = useVisualViewport();

  return (
    <div 
      className="app-scroll min-h-[100dvh] overflow-y-auto w-full flex-1 bg-background-primary flex flex-col"
      style={{
        paddingBottom: isKeyboardOpen ? `${Math.max(keyboardOffset, 20)}px` : 'env(safe-area-inset-bottom)'
      }}
    >
      {children || <Outlet />}
    </div>
  );
}
