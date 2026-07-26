import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAppStore } from '@/app/store';
import { cn } from '@/shared/utils/utils';
import { CheckCircle2, ArrowRight, ChevronLeft, LogOut } from 'lucide-react';
import { authService } from '@/features/auth/services/authService';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { complianceService } from '@/features/reports/services/complianceService';
import { motion, AnimatePresence } from 'motion/react';
import { hover, tap } from '@/features/reports/components/motion';
import { calculateMacros } from '@/shared/utils/profileCalculations';
import { analytics } from '@/shared/utils/analytics';
import { useToast } from '@/shared/components/Toast';

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let animationFrameId: number;
    const update = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); 
      setDisplayValue(Math.round(ease * value));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };
    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);
  return <span>{displayValue}</span>;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const onboardingData = useUserStore(s => s.onboardingData);
  const setOnboardingData = useUserStore(s => s.setOnboardingData);
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const editProfileMode = useUserStore(s => s.editProfileMode);
  const setEditProfileMode = useUserStore(s => s.setEditProfileMode);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });
  const queryClient = useQueryClient();
  const resetConfirmOpen = activeModal === 'reset_confirm';
  const setResetConfirmOpen = (isOpen: boolean) => setActiveModal(isOpen ? 'reset_confirm' : null);
  
  const name = useUserStore(s => s.temporaryOnboardingValues.name || "");
  const setName = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ name: val });
  const age = useUserStore(s => s.temporaryOnboardingValues.age || "");
  const setAge = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ age: val });
  const height = useUserStore(s => s.temporaryOnboardingValues.height || "");
  const setHeight = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ height: val });
  const heightUnit = useUserStore(s => s.temporaryOnboardingValues.heightUnit || "cm");
  const setHeightUnit = (val: "cm"|"ft") => useUserStore.getState().setTemporaryOnboardingValues({ heightUnit: val });

  const heightFt = useUserStore(s => s.temporaryOnboardingValues.heightFt || "");
  const setHeightFt = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ heightFt: val });
  const heightIn = useUserStore(s => s.temporaryOnboardingValues.heightIn || "");
  const setHeightIn = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ heightIn: val });
  const weight = useUserStore(s => s.temporaryOnboardingValues.weight || "");
  const setWeight = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ weight: val });
  
  const gender = useUserStore(s => s.temporaryOnboardingValues.gender || "");
  const setGender = (val: "Male"|"Female"|"") => useUserStore.getState().setTemporaryOnboardingValues({ gender: val });
  const activity = useUserStore(s => s.temporaryOnboardingValues.activity || "");
  const setActivity = (val: "Sedentary"|"Lightly Active"|"Moderately Active"|"Very Active"|"Athlete"|"") => useUserStore.getState().setTemporaryOnboardingValues({ activity: val });
  
  const [step, setStepState] = useState(0);
  const [direction, setDirection] = useState(1);
  const setStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStepState(newStep);
  }; // 0: Welcome, 1: Name, 2: Gender, 3: Age, 4: Height, 5: Weight, 6: Activity, 7: AI Analysis, 8: Results

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [step]);

  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > 0 && step < 8 && !editProfileMode) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, editProfileMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step > 0 && step < 7) {
        setStep(step - 1);
      } else if (e.key === 'ArrowLeft' && e.altKey && step > 0 && step < 7) {
        e.preventDefault();
        setStep(step - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  const [aiStatus, setAiStatus] = useState(0);
  
  const [results, setResults] = useState<any>(null);
  const [physique, setPhysique] = useState<number | null>(null);

  useEffect(() => {
    if (step === 0 && !editProfileMode) {
      analytics.trackEvent('Onboarding Started');
    }
  }, [step, editProfileMode]);

  useEffect(() => {
    if (step === 8) {
        // Run AI animation sequence
        const seq = async () => {
            await new Promise(r => setTimeout(r, 800));
            setAiStatus(1);
            await new Promise(r => setTimeout(r, 800));
            setAiStatus(2);
            await new Promise(r => setTimeout(r, 800));
            setAiStatus(3);
            await new Promise(r => setTimeout(r, 800));
            setAiStatus(4);
            await new Promise(r => setTimeout(r, 800));
            setAiStatus(5);
            await new Promise(r => setTimeout(r, 800));
            
            // Calculate results
            const w = parseFloat(weight) || 80;
            const h = getComputedHeight();
            const a = parseFloat(age) || 30;
            const macros = calculateMacros(w, h, a, gender || 'Male', activity || 'Lightly Active');
            setResults({
              tdee: macros.tdee,
              proteinMin: macros.proteinMin,
              proteinMax: macros.proteinMax,
              proteinMid: macros.proteinMid,
              fatMin: macros.fatMin,
              fatMax: macros.fatMax,
              fatMid: macros.fatMid,
              carbMin: macros.carbMin,
              carbMax: macros.carbMax,
              carbMid: macros.carbMid,
              fiberMin: macros.fiberMin,
              fiberMax: macros.fiberMax,
              waterLitres: macros.waterLitres
            });
            
            setStep(9);
        };
        seq();
    }
  }, [step]);

  useEffect(() => {
    if (!editProfileMode) return;
    if (onboardingData?.name) setName(onboardingData.name);
    if (onboardingData?.age) setAge(String(onboardingData.age));
    if (onboardingData?.weightKg) setWeight(String(onboardingData.weightKg));
    if (onboardingData?.heightCm) {
      setHeight(String(onboardingData.heightCm));
      setHeightUnit('cm');
    }
    if (onboardingData?.gender) setGender(onboardingData.gender as 'Male' | 'Female');
    if (onboardingData?.activityLevel) setActivity(onboardingData.activityLevel as any);
    setStep(1); // Jump to first question if edit mode
  }, [editProfileMode, onboardingData]);

  const saveMutation = useMutation({
    mutationFn: async (profile: any) => {
      return await profileService.upsertProfile(profile);
    },
    onError: (error: any) => {
      console.error("Save mutation failed:", error);
      toast({ type: 'error', message: "Failed to save profile: " + (error.message || "Unknown error") });
    }
  });

  const getComputedHeight = () => {
    if (heightUnit === 'cm') return parseFloat(height) || 170;
    const ft = parseFloat(heightFt) || 0;
    const inc = parseFloat(heightIn) || 0;
    return Math.round(((ft * 12) + inc) * 2.54) || 170;
  };

  const handleSave = async () => {
    if (!results) return;
    const w = parseFloat(weight) || 80;
    const h = getComputedHeight();
    const a = parseFloat(age) || 30;

    try {
      const data = await saveMutation.mutateAsync({
        name: name.trim() || 'User', 
        age: a, 
        height: h, 
        weight: w, 
        gender: gender || 'Male', 
        activity_level: activity || 'Lightly Active',
        maintenance_kcal: results.tdee, 
        protein_target: results.proteinMid
      });

      if (data) {
        queryClient.setQueryData(['profile'], data);
      }

      setOnboardingData({
        ...onboardingData,
        name: name.trim() || 'User',
        weightKg: w,
        heightCm: h,
        age: a,
        gender,
        activityLevel: activity,
        tdee: results.tdee,
        proteinMin: results.proteinMin,
        proteinMax: results.proteinMax,
        proteinMid: results.proteinMid,
        fatMin: results.fatMin,
        fatMax: results.fatMax,
        fatMid: results.fatMid,
        carbMin: results.carbMin,
        carbMax: results.carbMax,
        carbMid: results.carbMid,
        fiberMin: results.fiberMin,
        fiberMax: results.fiberMax,
        waterLitres: results.waterLitres,
      });

      complianceService.updateTodayScore().then(() => {
        queryClient.invalidateQueries({ queryKey: ['complianceScore'] });
      }).catch(console.error);

      if (editProfileMode) {
        setEditProfileMode(false);
        navigate('/profile');
      } else {
        analytics.trackEvent('Onboarding Completed', {
          gender,
          activity_level: activity,
          tdee: results.tdee,
          protein_target: results.proteinMid
        });
        navigate('/goal');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isEditMode = editProfileMode;

  const resetMutation = useMutation({
    mutationFn: async () => {
      await profileService.deleteProfile();
      await profileService.deleteGoal();
      useUserStore.getState().clearUserStore();
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
  }
  
  const prefersReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  const stepVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      y: prefersReducedMotion ? 0 : (dir > 0 ? 20 : -20),
      scale: prefersReducedMotion ? 1 : 0.98
    }),
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as any, stiffness: 300, damping: 25 } },
    exit: (dir: number) => ({
      opacity: 0,
      y: prefersReducedMotion ? 0 : (dir > 0 ? -20 : 20),
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: { duration: 0.2 }
    })
  };

  return (
    <div className="flex-1 min-h-full w-full bg-[#0A0A0B] text-white flex flex-col relative font-sans">
        
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-[radial-gradient(ellipse_at_center,rgba(212,255,0,0.03)_0%,rgba(0,0,0,0)_60%)]" /></div>

      {/* Progress Indicator */}
      {step > 0 && step < 8 && (
        <div className="sticky top-0 w-full px-4 sm:px-8 pt-8 pb-4 sm:pt-12 sm:pb-6 z-50 flex items-center shrink-0 bg-[#0A0A0B]">
           <div className="w-[48px] shrink-0 flex justify-start">
             <button 
               onClick={() => setStep(step === 9 ? (gender === 'Male' ? 7 : 6) : (step === 7 ? 6 : step - 1))}
               className="text-zinc-500 hover:text-white transition-colors p-2 flex items-center justify-center bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-full hover:bg-[rgba(255,255,255,0.05)]"
               aria-label="Go Back"
             >
               <ChevronLeft size={24} />
             </button>
           </div>
           <div className="flex gap-2 flex-1 justify-center">
             {step < 8 && [1,2,3,4,5,6, ...(gender === 'Male' ? [7] : [])].map(s => (
               <motion.div 
                 key={s}
                 className={cn("h-1 rounded-full", step >= s ? "bg-[#D4FF00]" : "bg-zinc-800")}
                 animate={{ width: step === s ? 40 : 8 }}
                 transition={{ type: "spring" as any, stiffness: 300, damping: 30 }}
               />
             ))}
           </div>
           <div className="w-[48px] shrink-0 flex justify-end">
             <button 
               onClick={() => authService.logout()}
               className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors p-2 flex items-center justify-center bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-full hover:bg-[rgba(255,255,255,0.05)]"
               aria-label="Logout"
             >
               <LogOut size={18} />
             </button>
           </div>
           <div className="w-[48px] shrink-0" /> {/* Spacer */}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-xl mx-auto">
        <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
                <motion.div key="welcome" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="text-center w-full">
                    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">Let's build your transformation.</h1>
                    <p className="text-zinc-400 text-lg mb-12 max-w-sm mx-auto">I'll ask a few quick questions to create your personalized AI plan.</p>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep(1)}
                        className="bg-white text-black font-semibold rounded-full px-8 py-4 w-full max-w-[240px]"
                    >
                        Begin
                    </motion.button>
                </motion.div>
            )}

            {step === 1 && (
                <motion.div key="name" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">What should I call you?</h2>
                    <input aria-label="First name" 
                        type="text" 
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={(e) => {
                            const target = e.target;
                            setTimeout(() => {
                                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                        }}
                        placeholder="Your name"
                        className="w-full bg-transparent text-center text-4xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && name.trim()) setStep(2);
                        }}
                    />
                    <div className="mt-12 flex justify-center">
                        <motion.button 
                            disabled={!name.trim()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(2)}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 disabled:opacity-30 transition-opacity"
                        >
                            Continue
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div key="gender" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">What's your gender?</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {["Male", "Female"].map(g => (
                            <button
                                key={g}
                                onClick={() => {
                                    setGender(g as any);
                                    setTimeout(() => setStep(3), 400);
                                }}
                                className={cn(
                                    "p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden",
                                    gender === g ? "bg-[rgba(212,255,0,0.1)] border-[#D4FF00]" : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)]"
                                )}
                            >
                                <span className={cn("text-xl font-medium", gender === g ? "text-[#D4FF00]" : "text-white")}>{g}</span>
                            </button>
                        ))}
                    </div>
                                    <div className="mt-12 flex justify-center">
                        <motion.button 
                            disabled={!gender}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(3)}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 disabled:opacity-30 transition-opacity"
                        >
                            Continue
                        </motion.button>
                    </div>
                </motion.div>
            )}
            {step === 3 && (
                <motion.div key="age" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">How old are you?</h2>
                    <div className="flex items-center justify-center gap-4">
                        <input aria-label="Age" 
                            type="number" 
                            autoFocus
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            onFocus={(e) => {
                                const target = e.target;
                                setTimeout(() => {
                                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 300);
                            }}
                            placeholder="30"
                            className="w-[120px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && age) setStep(4);
                            }}
                        />
                        <span className="text-2xl text-zinc-500 font-medium pb-2">years</span>
                    </div>
                    <div className="mt-12 flex justify-center">
                        <motion.button 
                            disabled={!age}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(4)}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 disabled:opacity-30 transition-opacity"
                        >
                            Continue
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {step === 4 && (
                <motion.div key="height" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full flex flex-col items-center">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">How tall are you?</h2>
                    
                    <div className="bg-[rgba(255,255,255,0.05)] p-1 rounded-full flex gap-1 mb-8 relative">
                        <div 
                            className="absolute inset-y-1 bg-[#D4FF00] rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]" 
                            style={{ width: '48%', left: heightUnit === 'cm' ? '1%' : '51%' }}
                        />
                        <button onClick={() => setHeightUnit('cm')} className={cn("px-6 py-2 rounded-full text-sm font-medium transition-colors relative z-10 w-20", heightUnit === 'cm' ? "text-black" : "text-zinc-400")}>cm</button>
                        <button onClick={() => setHeightUnit('ft')} className={cn("px-6 py-2 rounded-full text-sm font-medium transition-colors relative z-10 w-20", heightUnit === 'ft' ? "text-black" : "text-zinc-400")}>ft/in</button>
                    </div>

                    {heightUnit === 'cm' ? (
                         <div className="flex items-center justify-center gap-4">
                             <input aria-label="Height in centimeters" 
                                 type="number" 
                                 autoFocus
                                 value={height}
                                 onChange={(e) => setHeight(e.target.value)}
                                 onFocus={(e) => {
                                     const target = e.target;
                                     setTimeout(() => {
                                         target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                     }, 300);
                                 }}
                                 placeholder="175"
                                 className="w-[160px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                                 onKeyDown={(e) => {
                                     if (e.key === 'Enter' && height) setStep(5);
                                 }}
                             />
                             <span className="text-2xl text-zinc-500 font-medium pb-2">cm</span>
                         </div>
                    ) : (
                         <div className="flex items-center justify-center gap-4">
                             <input aria-label="Height in feet" 
                                 type="number" 
                                 autoFocus
                                 value={heightFt}
                                 onChange={(e) => setHeightFt(e.target.value)}
                                 onFocus={(e) => {
                                     const target = e.target;
                                     setTimeout(() => {
                                         target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                     }, 300);
                                 }}
                                 placeholder="5"
                                 className="w-[80px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                             />
                             <span className="text-2xl text-zinc-500 font-medium pb-2">ft</span>
                             <input aria-label="Height in inches" 
                                 type="number" 
                                 value={heightIn}
                                 onChange={(e) => setHeightIn(e.target.value)}
                                 onFocus={(e) => {
                                     const target = e.target;
                                     setTimeout(() => {
                                         target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                     }, 300);
                                 }}
                                 placeholder="9"
                                 className="w-[80px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                                 onKeyDown={(e) => {
                                     if (e.key === 'Enter' && heightFt) setStep(5);
                                 }}
                             />
                             <span className="text-2xl text-zinc-500 font-medium pb-2">in</span>
                         </div>
                    )}
                    
                    <div className="mt-12 flex justify-center">
                        <motion.button 
                            disabled={heightUnit === 'cm' ? !height : (!heightFt && !heightIn)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(5)}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 disabled:opacity-30 transition-opacity"
                        >
                            Continue
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {step === 5 && (
                <motion.div key="weight" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">Current weight?</h2>
                    <div className="flex items-center justify-center gap-4">
                        <input aria-label="Weight" 
                            type="number" 
                            autoFocus
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            onFocus={(e) => {
                                const target = e.target;
                                setTimeout(() => {
                                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 300);
                            }}
                            placeholder="70"
                            className="w-[160px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && weight) setStep(6);
                            }}
                        />
                        <span className="text-2xl text-zinc-500 font-medium pb-2">kg</span>
                    </div>
                    <div className="mt-12 flex justify-center">
                        <motion.button 
                            disabled={!weight}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(6)}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 disabled:opacity-30 transition-opacity"
                        >
                            Continue
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {step === 6 && (
                <motion.div key="activity" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">How active are you?</h2>
                    <div className="flex flex-col gap-3">
                        {[
                            { label: 'Sedentary', desc: 'Desk job, little or no exercise', icon: '🛋️' },
                            { label: 'Lightly Active', desc: 'Daily walks, occasional yoga', icon: '🚶' },
                            { label: 'Moderately Active', desc: 'Gym 3–4 times a week', icon: '🏃' },
                            { label: 'Very Active', desc: 'Intense gym 5–6 times a week', icon: '🏋️' }
                        ].map(a => (
                            <button
                                key={a.label}
                                onClick={() => {
                                    setActivity(a.label as any);
                                    setTimeout(() => setStep(gender === 'Male' ? 7 : 8), 400);
                                }}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all duration-300 text-left flex items-center gap-4 group",
                                    activity === a.label ? "bg-[rgba(212,255,0,0.1)] border-[#D4FF00]" : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]"
                                )}
                            >
                                <span className="text-3xl group-hover:scale-110 transition-transform">{a.icon}</span>
                                <div>
                                    <div className={cn("text-lg font-semibold", activity === a.label ? "text-[#D4FF00]" : "text-white")}>{a.label}</div>
                                    <div className="text-sm text-zinc-400 mt-1">{a.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                                    <div className="mt-12 flex justify-center">
                        <motion.button 
                            disabled={!activity}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStep(gender === 'Male' ? 7 : 8)}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 disabled:opacity-30 transition-opacity"
                        >
                            Continue
                        </motion.button>
                    </div>
                </motion.div>
            )}
                        {step === 7 && (
                <motion.div key="physique" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2 text-center">Does this look similar to your current physique?</h2>
                    <p className="text-center text-zinc-400 mb-8">Select the image that closest matches your body right now.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto overflow-y-auto pb-8">
                        {[1, 2, 3, 4, 5, 6, 7].map(p => (
                            <button
                                key={p}
                                onClick={() => {
                                    setPhysique(p);
                                    setTimeout(() => setStep(8), 400);
                                }}
                                className={cn(
                                    "rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col group",
                                    physique === p ? "bg-[rgba(212,255,0,0.1)] border-[#D4FF00]" : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]"
                                )}
                            >
                                <div className="aspect-[3/4] w-full bg-zinc-900 relative">
                                    <img 
                                        src={`/male_physique_${p}.png`} 
                                        alt={`Male Physique ${p}`} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23333"><rect width="100%" height="100%"/></svg>';
                                        }}
                                    />
                                    {physique === p && (
                                        <div className="absolute top-2 right-2 bg-[#D4FF00] text-black rounded-full p-1 shadow-lg">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 text-center">
                                    <span className="text-sm font-medium">Type {p}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => setStep(8)}
                            className="bg-white text-black px-8 py-3 rounded-full font-semibold"
                        >
                            Continue
                        </button>
                    </div>
                </motion.div>
            )}

            {step === 8 && (
                <motion.div key="ai-analysis" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 mb-12">
                        <motion.div 
                            animate={{ rotate: 360, scale: [1, 1.05, 1] }} 
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-2 border-dashed border-[rgba(212,255,0,0.3)]"
                        />
                        <motion.div 
                            animate={{ rotate: -360, scale: [1, 1.1, 1] }} 
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-2 rounded-full border border-[rgba(255,255,255,0.1)]"
                        />
                        <div className="absolute inset-4 rounded-full bg-[rgba(212,255,0,0.2)] blur-xl animate-pulse" />
                        <div className="absolute inset-8 rounded-full bg-[#D4FF00] shadow-[0_0_40px_rgba(212,255,0,0.5)] flex items-center justify-center overflow-hidden">
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-8 h-1 bg-black rounded-full"
                            />
                        </div>
                    </div>
                    
                    <div className="h-8 relative w-full overflow-hidden flex justify-center">
                        <AnimatePresence mode="popLayout">
                            {aiStatus === 0 && <motion.p key="msg0" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Analyzing body profile...</motion.p>}
                            {aiStatus === 1 && <motion.p key="msg1" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Calculating maintenance calories...</motion.p>}
                            {aiStatus === 2 && <motion.p key="msg2" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Estimating body fat...</motion.p>}
                            {aiStatus === 3 && <motion.p key="msg3" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Generating nutrition targets...</motion.p>}
                            {aiStatus === 4 && <motion.p key="msg4" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Building your transformation roadmap...</motion.p>}
                            {aiStatus === 5 && <motion.p key="msg5" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="text-xl text-white font-medium">Almost ready...</motion.p>}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}

            {step === 9 && results && (
                <motion.div key="results" variants={stepVariants} custom={direction} initial="initial" animate="animate" exit="exit" className="w-full py-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-4xl font-semibold tracking-tight text-white mb-4">Your Transformation Plan</h2>
                        <p className="text-zinc-400">Based on your profile, here are your optimized daily targets.</p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6, type: "spring" as any, stiffness: 200 }}
                            className="col-span-2 bg-[rgba(212,255,0,0.05)] border border-[rgba(212,255,0,0.2)] rounded-3xl p-6 flex items-center justify-between"
                        >
                            <div>
                                <div className="text-sm text-[rgba(212,255,0,0.7)] font-semibold uppercase tracking-wider mb-1">Maintenance Calories</div>
                                <div className="text-5xl font-bold text-[#D4FF00] tracking-tight"><AnimatedNumber value={results.tdee} /></div>
                            </div>
                            <div className="text-4xl">🔥</div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-3xl p-6"
                        >
                            <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">Protein</div>
                            <div className="text-2xl font-bold text-white"><AnimatedNumber value={results.proteinMid} />g</div>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-3xl p-6"
                        >
                            <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">Fats</div>
                            <div className="text-2xl font-bold text-white"><AnimatedNumber value={results.fatMid} />g</div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
                            className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-3xl p-6"
                        >
                            <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">Carbs</div>
                            <div className="text-2xl font-bold text-white"><AnimatedNumber value={results.carbMid} />g</div>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.6 }}
                            className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-3xl p-6"
                        >
                            <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">Water</div>
                            <div className="text-2xl font-bold text-white"><AnimatedNumber value={results.waterLitres} />L</div>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.2 }}
                        className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-3xl p-6 mb-12 flex gap-4"
                    >
                        <div className="text-3xl">🤖</div>
                        <div className="text-sm text-zinc-300 leading-relaxed">
                            Based on your profile, losing approximately 0.5 kg/week is realistic. Your first milestone is expected in 8 weeks if you stay consistent.
                        </div>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3.0, duration: 1 }}
                        className="flex justify-center pb-8"
                    >
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="bg-[#D4FF00] text-black font-semibold rounded-full px-12 py-4 flex items-center justify-center gap-2 min-w-[200px]"
                        >
                            {saveMutation.isPending ? 'Saving...' : 'Continue'}
                            {!saveMutation.isPending && <ArrowRight size={20} />}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
