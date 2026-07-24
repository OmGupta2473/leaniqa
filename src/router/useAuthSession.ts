import { useChatStore } from '@/app/store/chatStore';
import { useEffect } from 'react';
import { supabase } from '@/shared/utils/supabase';
import { useAuthStore } from '@/app/store/authStore';
import { setCrashReportingUser, clearCrashReportingUser } from '@/shared/utils/logger';
import { analytics } from '@/shared/utils/analytics';

export function useAuthSession() {
  const { session, loading, initialized, setSession, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    if (initialized) return;

    let mounted = true;

    const handleSessionUser = (localSession: any) => {
      if (localSession?.user) {
        setCrashReportingUser({
          id: localSession.user.id,
          email: localSession.user.email,
        });
        analytics.identifyUser(localSession.user.id);
      } else {
        clearCrashReportingUser();
      }
    };

    const initializeSession = async () => {
      try {
        const { data: { session: localSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(localSession);
          handleSessionUser(localSession);
        }
      } catch (err) {
        console.error('Error initializing session:', err);
        if (mounted) setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (mounted) {
        setSession(newSession);
        handleSessionUser(newSession);
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
  }, [initialized, setSession, setLoading, setInitialized]);

  return { session, loading };
}
