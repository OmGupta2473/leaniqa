import { useAuthStore } from '@/app/store/authStore';

/** Returns the synchronously cached authenticated user id, if one exists. */
export function getSessionUserId(): string | null {
  return useAuthStore.getState().session?.user.id ?? null;
}
