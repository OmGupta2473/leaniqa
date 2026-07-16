import { useChatStore } from "@/app/store";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAppStore } from '@/app/store';
import { cn } from '@/shared/utils/utils';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { complianceService } from '@/features/reports/services/complianceService';
import { motion, AnimatePresence } from 'motion/react';
import { hover, tap } from '@/features/reports/components/motion';
import { calculateMacros } from '@/shared/utils/profileCalculations';

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start: number | null = null;
    let animationFrameId: number;

    const update = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutExpo
      setDisplayValue(Math.round(ease * value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span ref={elementRef}>{displayValue}</span>;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const clearChatStore = useChatStore(s => s.clearChatStore);
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
  const waist = useUserStore(s => s.temporaryOnboardingValues.waist || "");
  const setWaist = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ waist: val });
  const neck = useUserStore(s => s.temporaryOnboardingValues.neck || "");
  const setNeck = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ neck: val });
  const hip = useUserStore(s => s.temporaryOnboardingValues.hip || "");
  const setHip = (val: string) => useUserStore.getState().setTemporaryOnboardingValues({ hip: val });
  const gender = useUserStore(s => s.temporaryOnboardingValues.gender || "");
  const setGender = (val: "Male"|"Female"|"") => useUserStore.getState().setTemporaryOnboardingValues({ gender: val });
  const activity = useUserStore(s => s.temporaryOnboardingValues.activity || "");
  const setActivity = (val: "Sedentary"|"Lightly Active"|"Moderately Active"|"Very Active"|"Athlete"|"") => useUserStore.getState().setTemporaryOnboardingValues({ activity: val });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  
  // Results
  const [results, setResults] = useState<any>(null);

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
  }, [editProfileMode, onboardingData]);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const newErrors = { ...errors };
    if (name.trim() && newErrors.name) delete newErrors.name;
    if (age && newErrors.age) delete newErrors.age;
    if (weight && newErrors.weight) delete newErrors.weight;
    if (heightUnit === 'cm' && height && newErrors.height) delete newErrors.height;
    if (heightUnit === 'ft' && heightFt && heightIn && newErrors.height) delete newErrors.height;
    if (waist && newErrors.waist) delete newErrors.waist;
    if (neck && newErrors.neck) delete newErrors.neck;
    if (gender === 'Female' && hip && newErrors.hip) delete newErrors.hip;
    if (gender && newErrors.gender) delete newErrors.gender;
    if (activity && newErrors.activity) delete newErrors.activity;
    
    if (Object.keys(newErrors).length !== Object.keys(errors).length) {
      setErrors(newErrors);
    }
  }, [name, age, weight, height, heightFt, heightIn, waist, neck, hip, heightUnit, gender, activity, errors]);

  const saveMutation = useMutation({
    mutationFn: async (profile: any) => {
      return await profileService.upsertProfile(profile);
    },
    onError: (error: any) => {
      console.error("Save mutation failed:", error);
      alert("Failed to save profile: " + (error.message || "Unknown error"));
    }
  });

  const toggleHeightUnit = (unit: 'cm'|'ft') => {
    if (unit === heightUnit) return;
    if (unit === 'ft') {
      const cm = parseFloat(height);
      if (!isNaN(cm) && cm > 0) {
        const totalInches = cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFt(ft.toString());
        setHeightIn(inches.toString());
      } else {
        setHeightFt('');
        setHeightIn('');
      }
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inc = parseFloat(heightIn) || 0;
      if (ft > 0 || inc > 0) {
        const totalInches = (ft * 12) + inc;
        const cm = Math.round(totalInches * 2.54);
        setHeight(cm.toString());
      } else {
        setHeight('');
      }
    }
    setHeightUnit(unit);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!gender) newErrors.gender = 'Please select your gender';
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!age) newErrors.age = 'Age is required';
    if (!weight) newErrors.weight = 'Weight is required';
    if (heightUnit === 'cm') {
      if (!height) newErrors.height = 'Height is required';
    } else {
      if (!heightFt || !heightIn) newErrors.height = 'Height is required';
    }
    if (!activity) newErrors.activity = 'Please select your activity level';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getComputedHeight = () => {
    let h = parseFloat(height) || 0;
    if (heightUnit === 'ft') {
      const ft = parseFloat(heightFt) || 0;
      const inc = parseFloat(heightIn) || 0;
      if (ft > 0 || inc > 0) {
        h = Math.round(((ft * 12) + inc) * 2.54);
      }
    }
    return h || 175;
  };

  const calculateResults = () => {
    if (!validateStep1()) return;

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
    setShowResults(true);
  };

  const handleSave = async () => {
    if (!validateStep1() || !results) return;

    const w = parseFloat(weight) || 80;
    const h = getComputedHeight();
    const a = parseFloat(age) || 30;

    try {
      // 1. Await the profile save operation
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

      console.log('Profile saved, updating cache and store');

      // 2. Synchronously update the React Query Cache
      if (data) {
        queryClient.setQueryData(['profile'], data);
      }

      // 3. Synchronously update the Zustand Store with full calculated fields
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

      // Execute background task cleanly
      complianceService.updateTodayScore().then(() => {
        queryClient.invalidateQueries({ queryKey: ['complianceScore'] });
      }).catch(console.error);

      // 4. Navigate only after all state has been deterministically seeded
      if (editProfileMode) {
        setEditProfileMode(false);
        navigate('/profile');
      } else {
        navigate('/goal');
      }
    } catch (e) {
      console.error(e);
      // Handled in onError of mutation as well, but catch here prevents unhandled promise rejection
    }
  };

  const inputClass = (hasError: boolean) => cn(
    "input-apple",
    hasError && "border-[rgba(255,59,48,0.6)] bg-[rgba(255,59,48,0.05)] focus:border-[rgba(255,59,48,0.6)] focus:shadow-[0_0_0_3px_rgba(255,59,48,0.12)]"
  );

  const isEditMode = editProfileMode;
  const currentStep = showResults ? 2 : 1;
  const totalSteps = 2;

  if (profile && !isEditMode) {
    return (
      <div className="screen-container animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-[#D4FF00] mx-auto mb-4" />
          <h2 className="text-[34px] font-bold text-white tracking-[-0.5px] mb-2">Profile Completed</h2>
          <p className="text-[15px] font-normal tracking-[-0.1px] text-[#EBEBF5CC]">You have already set up your profile and goals.</p>
        </div>

        <div className="glass-card p-[16px_20px] mb-6">
          <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[#EBEBF599] mb-[12px]">Current Profile Data</h3>
          <div className="space-y-[12px]">
<div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Name</span>
              <span className="text-[17px] font-semibold text-white">{profile.name || onboardingData?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Age</span>
              <span className="text-[17px] font-semibold text-white">{profile.age || onboardingData?.age || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Weight</span>
              <span className="text-[17px] font-semibold text-white">{profile.weight || onboardingData?.weightKg || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">kg</span></span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Height</span>
              <span className="text-[17px] font-semibold text-white">{profile.height || onboardingData?.heightCm || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">cm</span></span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Activity</span>
              <span className="text-[17px] font-semibold text-white">{profile.activity_level || onboardingData?.activityLevel || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">TDEE</span>
              <span className="text-[17px] font-semibold text-white">{profile.maintenance_kcal || onboardingData?.tdee || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">kcal</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Protein Target</span>
              <span className="text-[17px] font-semibold text-white">{profile.protein_target || onboardingData?.proteinMid || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">g</span></span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setResetConfirmOpen(true)}
          className="w-full py-[14px] bg-[rgba(255,255,255,0.1)] text-white font-semibold text-[15px] rounded-[100px] border-[0.5px] border-[rgba(255,255,255,0.2)] transition-transform active:scale-[0.96]"
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
          View body goal →
        </button>
        
        {resetConfirmOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ background: '#1C1C1E', borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '360px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '12px', letterSpacing: '-0.4px' }}>
                Reset your profile?
              </div>
              <div style={{ fontSize: '15px', color: 'rgba(235,235,245,0.6)', lineHeight: 1.5, marginBottom: '32px' }}>
                This permanently erases your body stats and macro targets. Your body goal and meal history remain. This cannot be undone.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => setResetConfirmOpen(false)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '100px',
                    background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)',
                    color: 'white', fontWeight: 600, fontSize: 'var(--font-md)', cursor: 'pointer'
                  }}
                >
                  Keep my profile
                </button>
                <button 
                  onClick={() => {
                    setOnboardingData(undefined);
                    clearChatStore();
                    window.location.reload();
                  }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '100px',
                    background: '#FF3B30', border: 'none',
                    color: 'white', fontWeight: 700, fontSize: 'var(--font-md)', cursor: 'pointer'
                  }}
                >
                  Yes, reset everything
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="screen-container pb-24">
      {/* Progress Bar */}
      {!isEditMode && (
        <div className="w-full bg-[rgba(255,255,255,0.08)] h-[2px] absolute top-0 left-0">
          <div 
            className="h-full bg-[#D4FF00] rounded-r-full"
            style={{ 
              width: `${(currentStep / totalSteps) * 100}%`,
              transition: 'width 400ms cubic-bezier(0.16,1,0.3,1)'
            }}
          />
        </div>
      )}

      <div className="py-[28px] mb-[12px]">
        {!isEditMode && (
          <div className="text-[11px] uppercase tracking-wide text-[rgba(255,255,255,0.32)] mb-[8px]">
            Step {currentStep} of {totalSteps}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-[26px] font-semibold text-white tracking-tight -tracking-[0.4px] leading-tight mb-[8px]">
              {isEditMode ? 'Update your stats' : (showResults ? `Good work, ${name.trim() || 'there'}` : 'Personal Information')}
            </h2>
            <p className="text-[15px] font-normal text-[rgba(255,255,255,0.8)] tracking-[-0.1px]">
              {isEditMode ? 'Change any field below and recalculate.' : (showResults ? "Here's what your body needs daily" : 'We use the US Navy method for precision body fat targeting.')}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="mb-[20px] p-[12px] rounded-xl bg-[rgba(255,59,48,0.05)] border-[0.5px] border-[rgba(255,59,48,0.6)] text-[#FF3B30] text-[13px] text-center font-normal">
          Please fill in all fields to get your plan
        </div>
      )}
      
      {!showResults && (
        <div className="flex flex-col gap-[20px] mb-[28px]">
          {/* Gender */}
          <div className="flex flex-col gap-[8px]">
            <span className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium mb-[6px] block">Gender</span>
            <div className="bg-[rgba(255,255,255,0.06)] rounded-xl p-1 flex relative">
              {['Male', 'Female'].map(g => {
                const isActive = gender === g;
                return (
                  <button 
                    key={g} 
                    onClick={() => setGender(g as any)} 
                    className={cn(
                      "flex-1 py-2.5 text-center text-sm rounded-lg cursor-pointer transition-all duration-200 relative z-10",
                      isActive ? "text-white font-medium" : "text-[rgba(255,255,255,0.45)] bg-transparent hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="segmentActiveGender"
                        className="absolute inset-0 bg-[rgba(255,255,255,0.12)] rounded-[10px] -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {g}
                  </button>
                )
              })}
            </div>
            {errors.gender && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.gender}</span>}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-[8px]">
            <span className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium mb-[6px] block">Your name</span>
            <input 
              className={inputClass(!!errors.name)} 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="First name" 
            />
            {errors.name && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.name}</span>}
          </div>

          {/* Age */}
          <div className="flex flex-col gap-[8px]">
            <span className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium mb-[6px] block">Age</span>
            <input 
              className={inputClass(!!errors.age)} 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              placeholder="Age" 
            />
            {errors.age && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.age}</span>}
          </div>

          {/* Height */}
          <div className="flex flex-col gap-[8px]">
            <div className="flex justify-between items-center mb-[6px]">
              <span className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium block">Height</span>
              <div className="bg-[rgba(255,255,255,0.06)] rounded-xl p-1 flex">
                <button 
                  onClick={() => toggleHeightUnit('cm')} 
                  className={cn("px-[12px] py-[4px] rounded-lg text-[12px] transition-all", heightUnit === 'cm' ? "bg-[rgba(255,255,255,0.12)] text-white font-medium" : "text-[rgba(255,255,255,0.45)]")}
                >cm</button>
                <button 
                  onClick={() => toggleHeightUnit('ft')} 
                  className={cn("px-[12px] py-[4px] rounded-lg text-[12px] transition-all", heightUnit === 'ft' ? "bg-[rgba(255,255,255,0.12)] text-white font-medium" : "text-[rgba(255,255,255,0.45)]")}
                >ft / in</button>
              </div>
            </div>
            {heightUnit === 'cm' ? (
              <input 
                className={inputClass(!!errors.height)} 
                type="number" 
                value={height} 
                onChange={e => setHeight(e.target.value)} 
                placeholder="e.g. 172" 
              />
            ) : (
              <div className="flex gap-[12px]">
                <div className="flex-1 relative">
                  <input 
                    className={inputClass(!!errors.height)} 
                    type="number" 
                    value={heightFt} 
                    onChange={e => setHeightFt(e.target.value)} 
                    placeholder="5" 
                  />
                  <span className="absolute right-[16px] top-[14px] text-[#EBEBF599] text-[17px]">ft</span>
                </div>
                <div className="flex-1 relative">
                  <input 
                    className={inputClass(!!errors.height)} 
                    type="number" 
                    value={heightIn} 
                    onChange={e => setHeightIn(e.target.value)} 
                    placeholder="10" 
                  />
                  <span className="absolute right-[16px] top-[14px] text-[#EBEBF599] text-[17px]">in</span>
                </div>
              </div>
            )}
            {errors.height && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.height}</span>}
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-[8px]">
            <span className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium mb-[6px] block">Weight (kg)</span>
            <input 
              className={inputClass(!!errors.weight)} 
              type="number" 
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              placeholder="e.g. 80" 
            />
            {errors.weight && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.weight}</span>}
          </div>

          {/* Activity level */}
          <div className="flex flex-col gap-[8px] mt-[8px]">
            <span className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium mb-[6px] block">Activity level</span>
            <div className="bg-[rgba(255,255,255,0.06)] rounded-xl p-1 flex flex-col gap-[4px] relative">
              {[
                { label: 'Sedentary', desc: 'Desk job, little or no exercise' },
                { label: 'Lightly Active', desc: 'Daily walks, occasional yoga' },
                { label: 'Moderately Active', desc: 'Gym 3–4 times a week' },
                { label: 'Very Active', desc: 'Intense gym 5–6 times a week' },
                { label: 'Athlete', desc: 'Competitive sports, daily training' }
              ].map(a => {
                const isActive = activity === a.label;
                return (
                  <button 
                    key={a.label} 
                    onClick={() => setActivity(a.label as any)} 
                    className={cn(
                      "py-2.5 px-3 text-left rounded-lg cursor-pointer transition-all duration-200 relative z-10",
                      isActive ? "text-white font-medium" : "text-[rgba(255,255,255,0.45)] bg-transparent hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="segmentActiveActivity"
                        className="absolute inset-0 bg-[rgba(255,255,255,0.12)] rounded-[10px] -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="text-sm font-semibold">{a.label}</div>
                    <div className="text-[11px] opacity-70 mt-0.5">{a.desc}</div>
                  </button>
                )
              })}
            </div>
            {errors.activity && <span className="text-[13px] text-[#FF3B30] mt-[6px]">{errors.activity}</span>}
          </div>
        </div>
      )}
      
      {showResults && results && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-[28px]"
        >
          <div className="card-lime mb-[28px] overflow-hidden">
            <div className="p-[20px]">
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(212,255,0,0.1)]">
                <span className="text-[11px] uppercase tracking-wide text-[rgba(212,255,0,0.6)]">Calories</span>
                <span className="text-[28px] font-bold text-[#D4FF00]">
                  <AnimatedNumber value={results.tdee} /> <span className="text-[13px] font-medium text-[rgba(212,255,0,0.5)]">kcal</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(212,255,0,0.1)]">
                <span className="text-[11px] uppercase tracking-wide text-[rgba(212,255,0,0.6)]">Protein</span>
                <span className="text-[28px] font-bold text-[#D4FF00]">
                  <AnimatedNumber value={results.proteinMin} />–<AnimatedNumber value={results.proteinMax} /> <span className="text-[13px] font-medium text-[rgba(212,255,0,0.5)]">g/day</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(212,255,0,0.1)]">
                <span className="text-[11px] uppercase tracking-wide text-[rgba(212,255,0,0.6)]">Fat</span>
                <span className="text-[28px] font-bold text-[#D4FF00]">
                  <AnimatedNumber value={results.fatMin} />–<AnimatedNumber value={results.fatMax} /> <span className="text-[13px] font-medium text-[rgba(212,255,0,0.5)]">g/day</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(212,255,0,0.1)]">
                <span className="text-[11px] uppercase tracking-wide text-[rgba(212,255,0,0.6)]">Carbohydrates</span>
                <span className="text-[28px] font-bold text-[#D4FF00]">
                  <AnimatedNumber value={results.carbMin} />–<AnimatedNumber value={results.carbMax} /> <span className="text-[13px] font-medium text-[rgba(212,255,0,0.5)]">g/day</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px] border-b border-[rgba(212,255,0,0.1)]">
                <span className="text-[11px] uppercase tracking-wide text-[rgba(212,255,0,0.6)]">Fiber</span>
                <span className="text-[28px] font-bold text-[#D4FF00]">
                  <AnimatedNumber value={results.fiberMin} />–<AnimatedNumber value={results.fiberMax} /> <span className="text-[13px] font-medium text-[rgba(212,255,0,0.5)]">g/day</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-[12px]">
                <span className="text-[11px] uppercase tracking-wide text-[rgba(212,255,0,0.6)]">Water</span>
                <span className="text-[28px] font-bold text-[#D4FF00]">
                  <AnimatedNumber value={parseFloat(results.waterLitres)} /> <span className="text-[13px] font-medium text-[rgba(212,255,0,0.5)]">L/day</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mb-[28px]">
            <h3 className="text-[11px] uppercase tracking-wide text-[rgba(255,255,255,0.4)] mb-[12px]">Your Stats</h3>
            <div className="grid grid-cols-3 gap-[12px]">
              <div className="bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[16px] flex flex-col items-center text-center border border-[rgba(255,255,255,0.05)]">
                <span className="text-[24px] font-bold text-white mb-[4px]">{weight || '—'}</span>
                <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.4)] uppercase">Current<br/>Weight</span>
              </div>
              
              <div className="bg-[rgba(212,255,0,0.1)] border-[0.5px] border-[rgba(212,255,0,0.3)] rounded-[16px] p-[16px] flex flex-col items-center text-center">
                <span className="text-[24px] font-bold text-[#D4FF00] mb-[4px]"><AnimatedNumber value={results.tdee} /></span>
                <span className="text-[11px] font-semibold text-[rgba(212,255,0,0.6)] uppercase">Maint.<br/>Calories</span>
              </div>

              <div className="bg-[rgba(255,255,255,0.05)] rounded-[16px] p-[16px] flex flex-col items-center text-center border border-[rgba(255,255,255,0.05)]">
                <span className="text-[24px] font-bold text-white mb-[4px]">
                  {heightUnit === 'cm' ? height : `${heightFt}'${heightIn}"`}
                </span>
                <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.4)] uppercase">Current<br/>Height</span>
              </div>
            </div>
          </div>
          
          {isEditMode && (
            <button
              onClick={() => { setEditProfileMode(false); navigate('/profile'); }}
              className="w-full text-[13px] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors py-3 mt-2"
            >
              Cancel — go back
            </button>
          )}
        </motion.div>
      )}

      <div className="mt-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {!showResults && (
          <motion.button 
            whileHover={hover.glow}
            whileTap={tap.scale}
            onClick={calculateResults} 
            disabled={saveMutation.isPending} 
            className="btn-primary w-full max-w-[400px] mx-auto lg:max-w-full block"
          >
            {isEditMode ? 'Recalculate targets' : 'Calculate targets'}
          </motion.button>
        )}
        
        {showResults && results && (
          <motion.button 
            whileHover={hover.glow}
            whileTap={tap.scale}
            onClick={handleSave} 
            disabled={saveMutation.isPending} 
            className="btn-primary w-full max-w-[400px] mx-auto lg:max-w-full flex items-center justify-center gap-2 group"
          >
            {saveMutation.isPending ? 'Saving...' : (isEditMode ? 'Save changes' : 'Set my physique goal')}
            {!isEditMode && <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-[3px]" />}
          </motion.button>
        )}
      </div>
    </div>
  );
}
