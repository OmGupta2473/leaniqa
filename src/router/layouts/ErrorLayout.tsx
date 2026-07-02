import { Outlet } from 'react-router-dom';

export function ErrorLayout() {
  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center">
      <Outlet />
    </div>
  );
}
