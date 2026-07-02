import { Navigate, Outlet } from 'react-router-dom';
import { useAuthSession } from './useAuthSession';

export function GuestRoute() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary text-text-secondary text-[14px]">
        Loading...
      </div>
    );
  }

  if (session) {
    return <Navigate to="/redirect" replace />;
  }

  return <Outlet />;
}
