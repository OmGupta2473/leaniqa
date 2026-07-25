import re

with open("src/router/useAuthSession.ts", "r") as f:
    content = f.read()

old_auth = """import { useEffect, useState } from 'react';
import { supabase } from '@/shared/utils/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, isLoading };
}"""

new_auth = """import { useEffect, useState } from 'react';
import { supabase } from '@/shared/utils/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          setIsLoading(false);
        }
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession && _event === 'SIGNED_IN') {
         // Optionally verify on sign in as well, though usually not needed if coming from the provider
         // But for robust checks:
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) {
            await supabase.auth.signOut();
            if (mounted) setSession(null);
            return;
         }
      }
      if (mounted) {
        setSession(newSession);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}"""

content = content.replace(old_auth, new_auth)

with open("src/router/useAuthSession.ts", "w") as f:
    f.write(content)

