import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAppStore } from '@/app/store';
import { cn } from '@/shared/utils/utils';
import { CheckCircle2, ArrowRight, ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { complianceService } from '@/features/reports/services/complianceService';
import { motion, AnimatePresence } from 'motion/react';
import { hover, tap } from '@/features/reports/components/motion';
import { calculateMacros } from '@/shared/utils/profileCalculations';
import { analytics } from '@/shared/utils/analytics';

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
  
  const [step, setStep] = useState(0); // 0: Welcome, 1: Name, 2: Gender, 3: Age, 4: Height, 5: Weight, 6: Activity, 7: AI Analysis, 8: Results

  const [aiStatus, setAiStatus] = useState(0);
  
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (step === 0 && !editProfileMode) {
      analytics.trackEvent('Onboarding Started');
    }
  }, [step, editProfileMode]);

  useEffect(() => {
    if (step === 7) {
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
            
            setStep(8);
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
      alert("Failed to save profile: " + (error.message || "Unknown error"));
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
      </div>
    );
  }
  
  const stepVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as any, stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0B] text-white flex flex-col relative overflow-hidden font-sans">
        
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-[radial-gradient(ellipse_at_center,rgba(212,255,0,0.03)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />

      {/* Progress Indicator */}
      {step > 0 && step < 7 && (
        <div className="fixed top-6 left-0 w-full px-8 z-50 flex items-center justify-center gap-2">
           <button 
             onClick={() => setStep(step - 1)}
             className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
           >
             <ChevronLeft size={28} />
           </button>
           {[1,2,3,4,5,6].map(s => (

             <motion.div 
               key={s} 
               className={cn("h-1 rounded-full", step >= s ? "bg-[#D4FF00]" : "bg-zinc-800")}
               animate={{ width: step === s ? 40 : 8 }}
               transition={{ type: "spring" as any, stiffness: 300, damping: 30 }}
             />
           ))}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10 w-full max-w-xl mx-auto min-h-screen">
        <AnimatePresence mode="wait">
            {step === 0 && (
                <motion.div key="welcome" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center w-full">
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
                <motion.div key="name" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">What should I call you?</h2>
                    <input 
                        type="text" 
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                <motion.div key="gender" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full">
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
                </motion.div>
            )}

            {step === 3 && (
                <motion.div key="age" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">How old are you?</h2>
                    <div className="flex items-center justify-center gap-4">
                        <input 
                            type="number" 
                            autoFocus
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
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
                <motion.div key="height" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full flex flex-col items-center">
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
                             <input 
                                 type="number" 
                                 autoFocus
                                 value={height}
                                 onChange={(e) => setHeight(e.target.value)}
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
                             <input 
                                 type="number" 
                                 autoFocus
                                 value={heightFt}
                                 onChange={(e) => setHeightFt(e.target.value)}
                                 placeholder="5"
                                 className="w-[80px] bg-transparent text-center text-6xl font-semibold text-white placeholder-zinc-800 outline-none border-none caret-[#D4FF00]"
                             />
                             <span className="text-2xl text-zinc-500 font-medium pb-2">ft</span>
                             <input 
                                 type="number" 
                                 value={heightIn}
                                 onChange={(e) => setHeightIn(e.target.value)}
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
                <motion.div key="weight" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center">Current weight?</h2>
                    <div className="flex items-center justify-center gap-4">
                        <input 
                            type="number" 
                            autoFocus
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
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
                <motion.div key="activity" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full">
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
                                    setTimeout(() => setStep(7), 400);
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
                </motion.div>
            )}

            {step === 7 && (
                <motion.div key="ai-analysis" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full flex flex-col items-center justify-center">
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

            {step === 8 && results && (
                <motion.div key="results" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="w-full py-12">
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
