import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthSession } from './useAuthSession';

export function GuestRoute() {
  const { session, loading } = useAuthSession();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (session) {
    const searchParams = new URLSearchParams(location.search);
    const nextParam = searchParams.get('next');
    let redirectTo = '/dashboard';

    if (nextParam && nextParam.startsWith('/')) {
      redirectTo = nextParam;
    } else if (location.state?.from?.pathname) {
      redirectTo = location.state.from.pathname + (location.state.from.search || '');
    }

    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
