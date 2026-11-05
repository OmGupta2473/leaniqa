import { useQuery } from '@tanstack/react-query';
import { gymOwnerService } from '../services/gymOwnerService';
import { useAuthSession } from '@/router/useAuthSession';

/**
 * `true` when the current user owns at least one gym. `false` when they own
 * none. `undefined` while the query is in flight. Callers that must not
 * flash content should treat `undefined` as "unknown" and show a skeleton.
 *
 * Uses the list_my_gyms RPC so the check is server-enforced and never leaks
 * another user's gyms into the client cache.
 */
export function useIsGymOwner(): boolean | undefined {
  const { session } = useAuthSession();
  const { data } = useQuery({
    queryKey: ['gymOwned'],
    queryFn: () => gymOwnerService.listOwnedGyms(),
    enabled: !!session,
    staleTime: 60_000,
  });
  if (!session) return false;
  if (data === undefined) return undefined;
  return data.length > 0;
}