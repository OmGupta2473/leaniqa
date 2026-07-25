with open('src/features/onboarding/pages/OnboardingPage.tsx', 'r') as f:
    c = f.read()

import re

old_block = """  if (profile && !isEditMode) {
    return (
      <div className="screen-container animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col justify-center min-h-screen">
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-[#D4FF00] mx-auto mb-4" />
          <h2 className="text-[34px] font-bold text-white tracking-[-0.5px] mb-2">Profile Completed</h2>
          <p className="text-[15px] font-normal tracking-[-0.1px] text-[#EBEBF5CC]">You have already set up your profile and goals.</p>
        </div>
        <button 
          onClick={() => setResetConfirmOpen(true)}
          className="w-full py-[14px] bg-[rgba(255,255,255,0.1)] text-white font-semibold text-[15px] rounded-full border-[0.5px] border-[rgba(255,255,255,0.2)] transition-transform active:scale-[0.96]"
        >
          Reset profile
        </button>
        <button 
          onClick={() => navigate('/goal')}
          style={{
            width: '100%', padding: '14px', borderRadius: '100px',
            background: 'rgba(212,255,0,0.1)', border: '0.5px solid rgba(212,255,0,0.3)',
            color: '#D4FF00', fontWeight: 600, fontSize: 'var(--font-md)',
            cursor: 'pointer', marginTop: '12px'
          }}
        >
          Continue to Goals
        </button>
      </div>
    );
  }"""

new_block = """  const resetMutation = useMutation({
    mutationFn: async () => {
      await profileService.resetProfile();
      useUserStore.getState().resetAll();
      queryClient.setQueryData(['profile'], null);
      queryClient.setQueryData(['goal'], null);
    },
    onSuccess: () => {
      setResetConfirmOpen(false);
      setStep(0);
      toast({ type: 'success', message: 'Profile reset successfully' });
    }
  });

  if (profile && !isEditMode) {
    return (
      <div className="screen-container animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col justify-center min-h-screen">
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-[#D4FF00] mx-auto mb-4" />
          <h2 className="text-[34px] font-bold text-white tracking-[-0.5px] mb-2">Profile Completed</h2>
          <p className="text-[15px] font-normal tracking-[-0.1px] text-[#EBEBF5CC]">You have already set up your profile and goals.</p>
        </div>
        <button 
          onClick={() => setResetConfirmOpen(true)}
          className="w-full py-[14px] bg-[rgba(255,255,255,0.1)] text-white font-semibold text-[15px] rounded-full border-[0.5px] border-[rgba(255,255,255,0.2)] transition-transform active:scale-[0.96]"
        >
          Reset profile
        </button>
        <button 
          onClick={() => navigate('/goal')}
          style={{
            width: '100%', padding: '14px', borderRadius: '100px',
            background: 'rgba(212,255,0,0.1)', border: '0.5px solid rgba(212,255,0,0.3)',
            color: '#D4FF00', fontWeight: 600, fontSize: 'var(--font-md)',
            cursor: 'pointer', marginTop: '12px'
          }}
        >
          Continue to Goals
        </button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {resetConfirmOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => !resetMutation.isPending && setResetConfirmOpen(false)}
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="bg-[#1A1A1C] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 w-full max-w-[340px] relative z-10 flex flex-col items-center text-center shadow-2xl"
                >
                  <h3 className="text-[24px] font-bold tracking-tight mb-2 text-white mb-2 tracking-tight">Reset Everything?</h3>
                  <p className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed mb-6 leading-relaxed">
                    This will delete your body stats and goals. Your logged meals and progress will remain, but you will need to complete onboarding again.
                  </p>
                  
                  <div className="flex flex-col w-full gap-3">
                    <button 
                      onClick={() => resetMutation.mutate()} 
                      disabled={resetMutation.isPending}
                      className="btn-primary-style rounded-full w-full py-3.5 bg-[#FF3B30] text-white text-[18px] font-semibold tracking-tight disabled:opacity-50 transition-opacity hover:opacity-90"
                    >
                      {resetMutation.isPending ? 'Resetting...' : 'Yes, reset profile'}
                    </button>
                    <button 
                      onClick={() => setResetConfirmOpen(false)} 
                      disabled={resetMutation.isPending}
                      className="btn-ghost w-full py-3.5 text-[15px] font-medium"
                    >
                      Keep my profile
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }"""

if old_block in c:
    c = c.replace(old_block, new_block)
    with open('src/features/onboarding/pages/OnboardingPage.tsx', 'w') as f:
        f.write(c)
    print("Fixed OnboardingPage")
else:
    print("Could not find block")
