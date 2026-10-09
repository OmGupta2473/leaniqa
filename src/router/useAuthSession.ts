import { useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/utils/supabase';
import { useAuthStore } from '@/app/store/authStore';
import { setCrashReportingUser } from '@/shared/utils/logger';
import { analytics } from '@/shared/utils/analytics';
import { offlineSyncService } from '@/shared/services/offlineSyncService';
import { authService } from '@/features/auth/services/authService';

let activeSessionUserId: string | null = null;
let lastFlushedUserId: string | null = null;

const USER_MARKER_KEY = 'leaniqa-active-user-id';

const readPersistedUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(USER_MARKER_KEY); } catch { return null; }
};

const writePersistedUserId = (userId: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (userId) window.localStorage.setItem(USER_MARKER_KEY, userId);
    else window.localStorage.removeItem(USER_MARKER_KEY);
  } catch { /* ignore quota/security errors */ }
};

export function useAuthSession() {
  const { session, loading, setSession, setLoading, setInitialized } = useAuthStore();
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    window.localStorage.removeItem('leaniqa-multi-account');

    let mounted = true;

    const activateSession = async (localSession: Session) => {
      const userId = localSession.user.id;
      const previousUserId = activeSessionUserId ?? readPersistedUserId();
      if (previousUserId && previousUserId !== userId) {
        await authService.onSessionEnded();
      }

      activeSessionUserId = userId;
      writePersistedUserId(userId);
      setSession(localSession);
      setCrashReportingUser({ id: userId, email: localSession.user.email });
      analytics.identifyUser(userId);

      if (lastFlushedUserId !== userId) {
        lastFlushedUserId = userId;
        void offlineSyncService.flush();
      }
    };

    const endSession = async () => {
      activeSessionUserId = null;
      lastFlushedUserId = null;
      writePersistedUserId(null);
      await authService.onSessionEnded();
    };

    const initializeSession = async () => {
      try {
        const { data: { session: localSession } } = await supabase.auth.getSession();
        if (localSession?.user) {
          await activateSession(localSession);
        } else {
          await endSession();
        }
      } catch (err) {
        console.error('Error initializing session:', err);
        await endSession();
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    if (!hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      void initializeSession();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        await endSession();
        setLoading(false);
        setInitialized(true);
        return;
      }

      await activateSession(newSession);
      if (mounted) {
        setLoading(false);
        setInitialized(true);

        if (event === 'SIGNED_IN' && newSession?.user) {
           const isSignUp = Math.abs(new Date(newSession.user.created_at).getTime() - new Date().getTime()) < 10000;
           if (isSignUp) {
             analytics.trackEvent('Sign Up');
           } else {
             analytics.trackEvent('Login');
           }

           const created = new Date(newSession.user.created_at);
           const now = new Date();
           const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24));
           if (diffDays === 1 || diffDays === 7 || diffDays === 30) {
             analytics.trackEvent('Retention Milestone', { day: diffDays });
           }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setLoading, setInitialized]);

  return { session, loading };
}
