import { Navigate, Outlet } from 'react-router-dom';
import { useAuthSession } from './useAuthSession';

export function GuestRoute() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return null;
  }

  if (session) {
    return <Navigate to="/redirect" replace />;
  }

  return <Outlet />;
}
