import { useChatStore } from '@/app/store/chatStore';
import { useEffect } from 'react';
import { supabase } from '@/shared/utils/supabase';
import { useAuthStore } from '@/app/store/authStore';

export function useAuthSession() {
  const { session, loading, initialized, setSession, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    if (initialized) return;

    let mounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session: localSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(localSession);
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
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized, setSession, setLoading, setInitialized]);

  return { session, loading };
}
