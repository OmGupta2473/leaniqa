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
        
        if (localSession) {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error || !user) {
            console.warn('Local session found but user is invalid on server. Clearing session.');
            await supabase.auth.signOut();
            useChatStore.getState().clearChatStore();
            if (mounted) setSession(null);
          } else {
            if (mounted) setSession(localSession);
          }
        } else {
          if (mounted) setSession(null);
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
      if (newSession && _event === 'SIGNED_IN') {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) {
            await supabase.auth.signOut();
            useChatStore.getState().clearChatStore();
            if (mounted) setSession(null);
            return;
         }
      }
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
