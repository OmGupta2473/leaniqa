import { useChatStore } from '@/app/store/chatStore';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/utils/supabase';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session: localSession } } = await supabase.auth.getSession();
        
        if (localSession) {
          // If we have a local session, verify it's still valid on the server.
          // This handles cases where a user was manually deleted from auth.users
          // but the JWT is still cached in localStorage.
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error || !user) {
            console.warn('Local session found but user is invalid on server. Clearing session.');
            await supabase.auth.signOut();
            useChatStore.getState().clearChatStore();
            if (mounted) {
              setSession(null);
            }
          } else {
            if (mounted) {
              setSession(localSession);
            }
          }
        } else {
          if (mounted) {
            setSession(null);
          }
        }
      } catch (err) {
        console.error('Error initializing session:', err);
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession && _event === 'SIGNED_IN') {
         // Verify on sign in as well
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
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
