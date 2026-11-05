import { Navigate, Outlet } from 'react-router-dom';
import { useIsGymOwner } from '../hooks/useIsGymOwner';
import { ScreenSkeleton } from '@/shared/components/ScreenSkeleton';

/**
 * Gate for /gym/* routes. Guests and non-owners are redirected to
 * /dashboard. While the ownership check is loading we render a skeleton
 * rather than flashing a redirect.
 */
export function GymOwnerRoute() {
  const isOwner = useIsGymOwner();
  if (isOwner === undefined) return <ScreenSkeleton />;
  if (!isOwner) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}