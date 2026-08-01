import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthSession } from '@/router/useAuthSession';
import { useMultiAccountStore } from '@/app/store/multiAccountStore';

export function SaveAccountPrompt() {
  const { session } = useAuthSession();
  const { accounts, saveAccount } = useMultiAccountStore();
  const [show, setShow] = React.useState(false);
  const [ignoredId, setIgnoredId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (session?.user) {
      const id = session.user.id;
      if (!accounts[id] && ignoredId !== id) {
        setShow(true);
      } else {
        setShow(false);
      }
    } else {
      setShow(false);
    }
  }, [session, accounts, ignoredId]);

  const handleSave = () => {
    if (session) {
      saveAccount(session, {
        name: session.user.user_metadata?.name || '',
        avatar_url: session.user.user_metadata?.avatar_url || ''
      });
    }
    setShow(false);
  };

  const handleNotNow = () => {
    if (session?.user) {
      setIgnoredId(session.user.id);
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[340px] rounded-3xl overflow-hidden p-5"
          style={{
            background: 'rgba(28, 28, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        >
          <div className="text-center mb-5">
            <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">Save this account?</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Save your login info for quick switching. This account can be accessed later without signing in again.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSave}
              className="w-full bg-[#D4FF00] text-black font-semibold rounded-2xl py-3 hover:opacity-90 transition-opacity"
            >
              Save Account
            </button>
            <button
              onClick={handleNotNow}
              className="w-full bg-white/10 text-white font-medium rounded-2xl py-3 hover:bg-white/15 transition-colors"
            >
              Not Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
