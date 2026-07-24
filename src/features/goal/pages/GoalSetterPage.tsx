
import React, { Profiler, useState, useEffect, useRef } from 'react';
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import { useNavigate } from "react-router-dom";
import { useUserStore } from '@/features/profile/store/userStore';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { useAppStore } from '@/app/store';
import { cn } from '@/shared/utils/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { complianceService } from '@/features/reports/services/complianceService';
import { CheckCircle2, AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Activity, Zap, Flame, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants, itemVariants, hover, tap } from '@/features/reports/components/motion';
import { ScreenSkeleton } from '@/shared/components/ScreenSkeleton';
import { calculateBodyComposition, calculateGoalStats, estimateBodyFatPercentage } from '@/shared/utils/profileCalculations';
import { haptics } from '@/shared/utils/haptics';
import { analytics } from '@/shared/utils/analytics';

// Use same options from BodyFatSelector but duplicate them here so we don't need to change its props or use it directly to have more control
const maleOptions = [
  { range: 'Under 8%', label: 'Essential fat', characteristics: ['Extremely lean', 'Visible striations', 'Competition level'], mid: 5 },
  { range: '8–12%', label: 'Athletic', characteristics: ['Visible abs', 'Very defined', 'Typical fitness model'], mid: 10 },
  { range: '12–15%', label: 'Fit', characteristics: ['Some ab definition', 'Lean look', 'Low belly fat'], mid: 13.5 },
  { range: '15–20%', label: 'Average fit', characteristics: ['Slight lower belly', 'Face appears lean', 'Waist visible', 'No visible abs'], mid: 17.5 },
  { range: '20–25%', label: 'Average', characteristics: ['Soft belly', 'Fuller face', 'No muscle definition'], mid: 22.5 },
  { range: '25–30%', label: 'Above average', characteristics: ['Noticeable belly', 'Rounder build', 'Love handles'], mid: 27.5 },
  { range: '30–40%', label: 'High body fat', characteristics: ['Significant fat storage', 'Round face', 'High waist circumference'], mid: 35 },
  { range: 'Above 40%', label: 'Obese', characteristics: ['Excessive fat storage across whole body', 'Health risks'], mid: 45 }
];

const femaleOptions = [
  { range: 'Under 14%', label: 'Essential fat', characteristics: ['Extremely lean', 'Visible striations', 'Competition level'], mid: 12 },
  { range: '14–20%', label: 'Athletic', characteristics: ['Visible abs', 'Very defined', 'Typical fitness model'], mid: 17 },
  { range: '20–24%', label: 'Fit', characteristics: ['Some definition', 'Lean look', 'Low belly fat'], mid: 22 },
  { range: '24–30%', label: 'Average fit', characteristics: ['Slight lower belly', 'Face appears lean', 'Waist visible', 'No visible abs'], mid: 27 },
  { range: '30–35%', label: 'Average', characteristics: ['Soft belly', 'Fuller face', 'No muscle definition'], mid: 32.5 },
  { range: '35–40%', label: 'Above average', characteristics: ['Noticeable belly', 'Rounder build', 'Love handles'], mid: 37.5 },
  { range: '40–50%', label: 'High body fat', characteristics: ['Significant fat storage', 'Round face', 'High waist circumference'], mid: 45 },
  { range: 'Above 50%', label: 'Obese', characteristics: ['Excessive fat storage across whole body', 'Health risks'], mid: 55 }
];

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
      const ease = 1 - Math.pow(1 - progress, 4); 
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

function BodyFatImagePlaceholder({ gender, categoryRange, className }: { gender: string, categoryRange: string, className?: string }) {
  return (
    <div className={cn("w-full h-full bg-[rgba(255,255,255,0.02)] flex flex-col items-center justify-center border border-[rgba(255,255,255,0.05)] relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-transparent pointer-events-none" />
      <div className="text-[rgba(255,255,255,0.2)] flex flex-col items-center relative z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          <rect width="20" height="14" x="2" y="6" rx="2"/>
        </svg>
        <span className="text-[10px] uppercase font-bold tracking-wider">{gender}</span>
        <span className="text-[10px] mt-1">{categoryRange}</span>
      </div>
    </div>
  );
}

export function GoalSetterPage() {
  useRenderTracker('GoalSetterPage');
  const navigate = useNavigate();
  const { profileData: onboardingData } = useCalculatedProfile();
  const setOnboardingData = useUserStore(s => s.setOnboardingData);
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isProfileLoading } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal, isLoading: isGoalLoading } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });

  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const resetGoalConfirm = activeModal === 'reset_goal_confirm';
  const setResetGoalConfirm = (isOpen: boolean) => setActiveModal(isOpen ? 'reset_goal_confirm' : null);

  const [step, setStep] = useState(0); // 0: ai_analysis_1, 1: current_bf, 2: target_bf, 3: ai_analysis_2, 4: speed, 5: customize, 6: summary
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Data state
  const [currentBfMid, setCurrentBfMid] = useState<number | null>(null);
  const [targetBfMid, setTargetBfMid] = useState<number | null>(null);
  const [selectedStrategyName, setSelectedStrategyName] = useState<string | null>(null);
  
  // Customization state
  const [customCalories, setCustomCalories] = useState<number | string | null>(null);
  const [customProtein, setCustomProtein] = useState<number | string | null>(null);
  const [customFat, setCustomFat] = useState<number | null>(null);
  const [customCarbs, setCustomCarbs] = useState<number | null>(null);

  if (isProfileLoading || isGoalLoading) {
    return <ScreenSkeleton />;
  }

  const tdee = onboardingData?.tdee || profile?.maintenance_kcal || 2500;
  const currentWeight = onboardingData?.weightKg || profile?.weight || 80;

  const age = onboardingData?.age || profile?.age || 30;
  const gender = onboardingData?.gender || profile?.gender || 'Male';
  const heightCm = onboardingData?.heightCm || profile?.height || 175;

  const estimatedBf = estimateBodyFatPercentage(currentWeight, heightCm, age, gender);

  const proteinMax = onboardingData?.proteinMax || 160;
  const proteinMid = onboardingData?.proteinMid || 150;
  const proteinMin = onboardingData?.proteinMin || 140;

  // Options
  const bfOptions = (gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f') ? femaleOptions : maleOptions;
  let recommendedCurrentOpt = bfOptions[0];
  let minDiff = Infinity;
  for (const opt of bfOptions) {
    const diff = Math.abs(opt.mid - estimatedBf);
    if (diff < minDiff) {
      minDiff = diff;
      recommendedCurrentOpt = opt;
    }
  }

  // Set initial current BF when entering step 1
  useEffect(() => {
    if (step === 1 && currentBfMid === null) {
      setCurrentBfMid(recommendedCurrentOpt.mid);
    }
  }, [step, currentBfMid, recommendedCurrentOpt]);

  // Calculations
  let fatToLoseKg = 0;
  let targetWeightKg = currentWeight;
  let currentFatMass = 0;
  let targetFatMass = 0;

  if (currentBfMid) {
    const comp = calculateBodyComposition(currentWeight, currentBfMid, targetBfMid || currentBfMid);
    currentFatMass = comp.fatMass;
    if (targetBfMid) {
      targetWeightKg = comp.targetWeightKg;
      targetFatMass = comp.targetFatMass;
      fatToLoseKg = comp.fatToLoseKg;
    }
  }

  const strategies = targetBfMid === currentBfMid ? [
    {
      name: 'Maintenance',
      deficit: 0,
      pros: 'No deficit needed, full energy',
      cons: 'Requires consistent nutrition discipline',
      isRecommended: true
    }
  ] : fatToLoseKg > 0 ? [
    {
      name: '🔥 Aggressive Cut',
      id: 'Aggressive',
      deficit: 600,
      pros: 'Fastest progress, Visible changes quickly',
      cons: 'Harder to sustain, More hunger',
      styleClass: 'border-[rgba(255,77,28,0.25)]',
      activeClass: 'border-[#FF4D1C] bg-[rgba(255,77,28,0.06)] shadow-[0_0_20px_rgba(255,77,28,0.15)]',
    },
    {
      name: '⚡ Balanced Cut',
      id: 'Recommended',
      deficit: 400,
      isRecommended: true,
      pros: 'Sustainable, Best muscle retention, Highest long-term success',
      cons: 'Requires consistency',
      styleClass: 'border-[rgba(212,255,0,0.4)]',
      activeClass: 'border-[#D4FF00] bg-[rgba(212,255,0,0.06)] shadow-[0_0_20px_rgba(212,255,0,0.15)]',
    },
    {
      name: '🌱 Slow & Sustainable',
      id: 'Slow & Steady',
      deficit: 200,
      pros: 'Easier adherence, Minimal fatigue',
      cons: 'Slower visible results',
      styleClass: 'border-[rgba(55,138,221,0.25)]',
      activeClass: 'border-[#378ADD] bg-[rgba(55,138,221,0.06)] shadow-[0_0_20px_rgba(55,138,221,0.15)]',
    }
  ] : [];

  const calculatedStrategies = strategies.map(s => {
    const stats = calculateGoalStats(tdee, currentWeight, currentBfMid || 0, targetBfMid || 0, s.deficit);
    return { 
      ...s, 
      dailyTarget: stats.dailyCalorieGoal, 
      weeks: stats.estimatedWeeks, 
      dateStr: stats.targetDateStr, 
      targetDateIso: stats.targetDateIso 
    };
  });

  const selectedStrategy = calculatedStrategies.find(s => s.id === selectedStrategyName) || calculatedStrategies.find(s => s.isRecommended) || calculatedStrategies[0];

  useEffect(() => {
    if (step === 4 && !selectedStrategyName && calculatedStrategies.length > 0) {
      setSelectedStrategyName(calculatedStrategies.find(s => s.isRecommended)?.id || calculatedStrategies[0].id);
    }
  }, [step, selectedStrategyName, calculatedStrategies]);

  useEffect(() => {
    if (step === 5) {
      if (customCalories === null && selectedStrategy) setCustomCalories(selectedStrategy.dailyTarget);
      if (customProtein === null) setCustomProtein(proteinMid);
      if (customFat === null && selectedStrategy) {
        const defaultFat = Math.round((currentWeight * 1.0)); // 1g per kg
        setCustomFat(defaultFat);
      }
    }
  }, [step, customCalories, customProtein, customFat, selectedStrategy, currentWeight, proteinMid]);

  useEffect(() => {
    const c = typeof customCalories === 'number' ? customCalories : parseInt(customCalories as string);
    const p = typeof customProtein === 'number' ? customProtein : parseInt(customProtein as string);
    if (!isNaN(c) && !isNaN(p) && customFat !== null) {
      const pCals = p * 4;
      const fCals = customFat * 9;
      const rem = c - pCals - fCals;
      setCustomCarbs(Math.max(0, Math.round(rem / 4)));
    }
  }, [customCalories, customProtein, customFat]);

  // AI Step 1 Progression
  useEffect(() => {
    if (step === 0 && !goal) {
      setAnalysisProgress(0);
      const messages = [
        "Calculating maintenance calories...",
        "Estimating body fat...",
        "Predicting body composition...",
        "Building your transformation profile..."
      ];
      
      let index = 0;
      const interval = setInterval(() => {
        index++;
        if (index >= messages.length) {
          clearInterval(interval);
          setTimeout(() => setStep(1), 800);
        } else {
          setAnalysisProgress(index);
        }
      }, 700);
      
      return () => clearInterval(interval);
    }
  }, [step, goal]);

  // AI Step 3 Progression
  useEffect(() => {
    if (step === 3) {
      const messages = [
        "Calculating fat to lose...",
        "Estimating timeline...",
        "Building nutrition strategy...",
        "Selecting safest calorie target...",
        "Preparing transformation plan..."
      ];
      setAnalysisProgress(0);
      let index = 0;
      const interval = setInterval(() => {
        index++;
        if (index >= messages.length) {
          clearInterval(interval);
          setTimeout(() => setStep(4), 800);
        } else {
          setAnalysisProgress(index);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [step]);


  const saveMutation = useMutation({
    mutationFn: async (strategyData: any) => {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        // Enqueue for offline
        const { offlineSyncService } = await import('@/shared/services/offlineSyncService');
        offlineSyncService.enqueue({
          type: 'SAVE_GOAL',
          payload: strategyData
        });
        return { strategyData, savedGoal: strategyData, _localOnly: true };
      }

      const savedGoal = await profileService.upsertGoal({
        current_bf: strategyData.current_bf,
        target_bf: strategyData.target_bf,
        strategy: strategyData.strategy,
        deficit_kcal: strategyData.deficit_kcal,
        target_date: strategyData.targetDateIso,
        target_weight: strategyData.targetWeightKg,
      });
      return { strategyData, savedGoal };
    },
    onMutate: async (strategyData: any) => {
      await queryClient.cancelQueries({ queryKey: ['goal'] });
      const previousGoal = queryClient.getQueryData(['goal']);
      
      const optimisticGoal = {
        current_bf: strategyData.current_bf,
        target_bf: strategyData.target_bf,
        strategy: strategyData.strategy,
        deficit_kcal: strategyData.deficit_kcal,
        target_date: strategyData.targetDateIso
      };

      queryClient.setQueryData(['goal'], optimisticGoal);
      return { previousGoal };
    },
    onError: (error, _, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(['goal'], context.previousGoal);
      }
      console.error("saveMutation error:", error);
      alert("Failed to save goal: " + error.message);
    },
    onSuccess: (data) => {
      setOnboardingData({
        ...onboardingData,
        currentBodyFatPct: data.strategyData.current_bf,
        targetBodyFatPct: data.strategyData.target_bf,
        fatToLoseKg: data.strategyData.fatToLoseKg,
        chosenStrategyName: data.strategyData.strategy,
        dailyCalorieGoal: data.strategyData.dailyTarget,
        dailyDeficit: data.strategyData.deficit_kcal,
        targetWeightKg: data.strategyData.targetWeightKg,
        estimatedWeeks: data.strategyData.estimatedWeeks,
        estimatedCompletionDate: data.strategyData.estimatedCompletionDate,
        macros: data.strategyData.macros
      });
      
      analytics.trackEvent('Goal Created', {
        strategy: data.strategyData.strategy,
        deficit_kcal: data.strategyData.deficit_kcal,
        fatToLoseKg: data.strategyData.fatToLoseKg,
        dailyTarget: data.strategyData.dailyTarget,
        estimatedWeeks: data.strategyData.estimatedWeeks
      });
      
      haptics.success();
      navigate('/dashboard');
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['goal'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        complianceService.updateTodayScore().then(() => 
          queryClient.invalidateQueries({ queryKey: ['complianceScore'] })
        ).catch(console.error)
      ]);
    }
  });

  const handleFinish = () => {
    if (!selectedStrategy) return;
    
    const parsedCals = typeof customCalories === 'number' ? customCalories : parseInt(customCalories as string);
    const parsedProtein = typeof customProtein === 'number' ? customProtein : parseInt(customProtein as string);
    
    let finalCals = selectedStrategy.dailyTarget;
    let finalDeficit = selectedStrategy.deficit;
    
    if (!isNaN(parsedCals) && parsedCals !== selectedStrategy.dailyTarget) {
      finalCals = parsedCals;
      finalDeficit = tdee - parsedCals;
    }
    
    saveMutation.mutate({
      current_bf: currentBfMid,
      target_bf: targetBfMid,
      strategy: selectedStrategy.name,
      deficit_kcal: finalDeficit,
      fatToLoseKg,
      dailyTarget: finalCals,
      targetWeightKg,
      estimatedWeeks: selectedStrategy.weeks,
      estimatedCompletionDate: selectedStrategy.dateStr,
      targetDateIso: selectedStrategy.targetDateIso,
      macros: {
        protein: isNaN(parsedProtein) ? proteinMid : parsedProtein,
        fat: customFat,
        carbs: customCarbs
      }
    });
  };

  const aiAnalysisMessages1 = [
    "Calculating maintenance calories...",
    "Estimating body fat...",
    "Predicting body composition...",
    "Building your transformation profile..."
  ];

  const aiAnalysisMessages2 = [
    "Calculating fat to lose...",
    "Estimating timeline...",
    "Building nutrition strategy...",
    "Selecting safest calorie target...",
    "Preparing transformation plan..."
  ];

  if (goal && step === 0) {
    const activeGoal = goal;
    const dailyKcal = profile?.maintenance_kcal && goal?.deficit_kcal !== undefined 
      ? profile.maintenance_kcal - goal.deficit_kcal 
      : (activeGoal as any)?.dailyCalorieGoal;

    return (
      <motion.div 
        variants={pageVariants} initial="hidden" animate="visible" exit="exit"
        className="screen-container pt-8 pb-24"
      >
        <div className="flex flex-col items-center justify-center py-10 mb-10 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#D4FF00] mb-4" />
          <h2 className="text-[28px] font-bold text-white tracking-tight mb-2">Goal Set</h2>
          <p className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">You have already set your physique goal.</p>
        </div>

        <div className="bg-[#111113] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 mb-10 shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-4">Current Goal Data</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
              <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Current BF%</span>
              <span className="text-[16px] font-medium text-white">{activeGoal?.current_bf || (activeGoal as any)?.currentBodyFatPct || '-'}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
              <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Target BF%</span>
              <span className="text-[16px] font-medium text-white">{activeGoal?.target_bf || (activeGoal as any)?.targetBodyFatPct || '-'}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
              <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Strategy</span>
              <span className="text-[16px] font-medium text-white">{activeGoal?.strategy || (activeGoal as any)?.chosenStrategyName || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
              <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Daily Target</span>
              <span className="text-[16px] font-medium text-white">{dailyKcal || '-'} <span className="text-[13px] text-[rgba(235,235,245,0.5)]">kcal</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Estimated Time</span>
              <span className="text-[16px] font-medium text-white">
                {activeGoal?.deficit_kcal === 0 || (activeGoal as any)?.dailyDeficit === 0 ? 'Ongoing' : 
                 activeGoal?.target_date ? new Date(activeGoal.target_date).toLocaleDateString() : 
                 (activeGoal as any)?.estimatedWeeks ? `~${(activeGoal as any).estimatedWeeks} weeks` : '-'}
              </span>
            </div>
          </div>
        </div>

        <motion.button 
          whileHover={hover.subtle}
          whileTap={tap.scale}
          onClick={() => setResetGoalConfirm(true)}
          className="btn-ghost w-full hover:text-[#FF4D1C] hover:border-[rgba(255,77,28,0.3)] transition-colors duration-200"
        >
          Reset goal
        </motion.button>
        
        <AnimatePresence>
          {resetGoalConfirm && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[rgba(0,0,0,0.85)] z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-[360px] text-center border border-[rgba(255,255,255,0.06)] shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
              >
                <div className="text-4xl mb-4">⚠️</div>
                <div className="text-[20px] font-bold text-white mb-3 tracking-tight">Reset body goal?</div>
                <div className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed leading-relaxed mb-10">
                  This will permanently erase your target body fat, strategy, and timeline. Your meal history and body stats will remain. This cannot be undone.
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setResetGoalConfirm(false)} className="w-full py-3.5 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] text-white font-semibold text-[15px]">
                    Keep my goal
                  </button>
                  <button onClick={async () => {
                      try {
                        await profileService.deleteGoal();
                        setResetGoalConfirm(false);
                        queryClient.setQueryData(['goal'], null);
                        setStep(0);
                      } catch { alert('Failed to reset goal. Try again.'); }
                    }} 
                    className="w-full py-3.5 rounded-full bg-[#FF3B30] text-white font-bold text-[15px]"
                  >
                    Yes, reset goal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <Profiler id="GoalSetterPage" onRender={onRenderCallback}>
      <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="min-h-screen bg-black text-white relative flex flex-col overflow-x-hidden">
        
        {/* Back Button */}
        {step > 0 && step !== 3 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="absolute top-6 left-6 z-50 p-2 text-[rgba(255,255,255,0.6)] hover:text-white transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div className="flex-1 w-full max-w-lg mx-auto flex flex-col px-6 pt-24 pb-32 relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 0: AI Analysis 1 */}
            {step === 0 && (
              <motion.div 
                key="step0"
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center flex-1 text-center"
              >
                <div className="relative w-32 h-32 mb-10">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[#D4FF00] rounded-full blur-[40px]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={40} className="text-[#D4FF00]" />
                  </div>
                </div>
                <h2 className="text-[24px] font-semibold text-white tracking-tight mb-4">Analyzing your body profile...</h2>
                <div className="h-[24px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={analysisProgress}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-[15px] text-[rgba(255,255,255,0.6)]"
                    >
                      {aiAnalysisMessages1[analysisProgress] || "Ready."}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Current Body Fat */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col flex-1"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.2)] px-4 py-2 rounded-full mb-6">
                    <span className="text-xl">✨</span>
                    <span className="text-[14px] font-semibold text-white">Estimated Current Body Fat: <span className="text-[#D4FF00]">{Math.round(estimatedBf)}%</span></span>
                  </div>
                  <h2 className="text-[28px] font-bold tracking-tight text-white mb-3">Does this look similar to your current physique?</h2>
                  <p className="text-[16px] text-[rgba(255,255,255,0.6)]">Select the image that closest matches your body right now.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1 content-start pb-20">
                  {bfOptions.map(opt => {
                    const isSelected = currentBfMid === opt.mid;
                    const isRec = recommendedCurrentOpt.mid === opt.mid;
                    return (
                      <motion.div
                        key={opt.range}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          haptics.tap();
                          setCurrentBfMid(opt.mid);
                          setTimeout(() => setStep(2), 500); // Auto-advance
                        }}
                        className={cn(
                          "relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300",
                          "bg-[#111113] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]",
                          isSelected && "border-[#D4FF00] shadow-[0_0_30px_rgba(212,255,0,0.15)]"
                        )}
                      >
                        <div className="aspect-[3/4] w-full relative">
                          <BodyFatImagePlaceholder gender={gender} categoryRange={opt.range} className="rounded-none border-none" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[rgba(17,17,19,0.5)] to-transparent pointer-events-none" />
                          {isRec && (
                            <div className="absolute top-3 left-3 px-2 py-1 bg-[rgba(0,0,0,0.6)] backdrop-blur-md text-[#D4FF00] border border-[rgba(212,255,0,0.3)] text-[10px] font-bold uppercase tracking-wider rounded-full">
                              Estimate
                            </div>
                          )}
                          <div className="absolute bottom-4 left-4 right-4 text-left">
                            <div className={cn("text-[22px] font-bold tracking-tight leading-none mb-1", isSelected ? "text-[#D4FF00]" : "text-white")}>{opt.range}</div>
                            <div className="text-[14px] font-medium text-[rgba(255,255,255,0.8)] leading-tight">{opt.label}</div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Target Body Fat */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col flex-1"
              >
                <div className="text-center mb-8">
                  <h2 className="text-[28px] font-bold tracking-tight text-white mb-3">What physique do you want to achieve?</h2>
                  <p className="text-[16px] text-[rgba(255,255,255,0.6)]">Choose your ultimate transformation goal.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1 content-start pb-20">
                  {bfOptions.filter(opt => currentBfMid ? opt.mid <= currentBfMid : true).map(opt => {
                    const isSelected = targetBfMid === opt.mid;
                    return (
                      <motion.div
                        key={opt.range}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          haptics.tap();
                          setTargetBfMid(opt.mid);
                          setTimeout(() => setStep(3), 500); // Auto-advance to AI planning
                        }}
                        className={cn(
                          "relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300",
                          "bg-[#111113] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]",
                          isSelected && "border-[#D4FF00] shadow-[0_0_30px_rgba(212,255,0,0.15)]"
                        )}
                      >
                        <div className="aspect-[3/4] w-full relative">
                          <BodyFatImagePlaceholder gender={gender} categoryRange={opt.range} className="rounded-none border-none" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[rgba(17,17,19,0.5)] to-transparent pointer-events-none" />
                          <div className="absolute bottom-4 left-4 right-4 text-left">
                            <div className={cn("text-[22px] font-bold tracking-tight leading-none mb-1", isSelected ? "text-[#D4FF00]" : "text-white")}>{opt.range}</div>
                            <div className="text-[14px] font-medium text-[rgba(255,255,255,0.8)] leading-tight">{opt.label}</div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: AI Planning */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center flex-1 text-center"
              >
                <div className="relative w-32 h-32 mb-10">
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[#D4FF00] rounded-full blur-[40px]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target size={40} className="text-[#D4FF00]" />
                  </div>
                </div>
                <h2 className="text-[24px] font-semibold text-white tracking-tight mb-4">Planning your transformation...</h2>
                <div className="h-[24px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={analysisProgress}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-[15px] text-[rgba(255,255,255,0.6)]"
                    >
                      {aiAnalysisMessages2[analysisProgress] || "Ready."}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Choose Speed */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col flex-1"
              >
                <div className="text-center mb-8">
                  <h2 className="text-[28px] font-bold tracking-tight text-white mb-3">Choose Your Strategy</h2>
                  <p className="text-[16px] text-[rgba(255,255,255,0.6)]">How fast do you want to transform?</p>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  {calculatedStrategies.map(s => {
                    const isSelected = selectedStrategyName === s.id;
                    return (
                      <motion.div
                        key={s.id}
                        onClick={() => {
                          haptics.tap();
                          setSelectedStrategyName(s.id);
                        }}
                        className={cn(
                          "relative rounded-3xl p-6 cursor-pointer transition-all duration-300 overflow-hidden",
                          "bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] backdrop-blur-xl",
                          isSelected ? "border-[#D4FF00] bg-[rgba(212,255,0,0.03)] scale-[1.02] shadow-[0_10px_40px_rgba(212,255,0,0.1)]" : "opacity-60 hover:opacity-100"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(212,255,0,0.05)] to-transparent pointer-events-none" />
                        )}
                        <div className="flex flex-col items-start mb-1 gap-2">
                          {s.isRecommended && (
                            <div className="px-3 py-1 bg-[rgba(212,255,0,0.1)] text-[#D4FF00] text-[11px] font-bold uppercase tracking-wider rounded-full border border-[rgba(212,255,0,0.2)]">
                              ⭐ AI Recommended
                            </div>
                          )}
                          <h3 className="text-[22px] font-bold text-white tracking-tight leading-none">{s.name}</h3>
                        </div>
                        <p className="text-[15px] font-medium text-[#D4FF00] mb-4">Approx. {s.deficit} kcal deficit</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-[rgba(0,0,0,0.2)] rounded-2xl p-3 border border-[rgba(255,255,255,0.03)]">
                            <div className="text-[11px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider font-semibold mb-1">Target Calories</div>
                            <div className="text-[20px] font-bold text-white">{s.dailyTarget}</div>
                          </div>
                          <div className="bg-[rgba(0,0,0,0.2)] rounded-2xl p-3 border border-[rgba(255,255,255,0.03)]">
                            <div className="text-[11px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider font-semibold mb-1">Estimated Date</div>
                            <div className="text-[18px] font-bold text-white truncate">{s.dateStr}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] mt-1.5 mr-2 shrink-0" />
                            <span className="text-[14px] text-[rgba(255,255,255,0.8)]"><strong>Pros:</strong> {s.pros}</span>
                          </div>
                          {s.cons && (
                            <div className="flex items-start">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] mt-1.5 mr-2 shrink-0" />
                              <span className="text-[14px] text-[rgba(255,255,255,0.6)]"><strong>Cons:</strong> {s.cons}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="fixed bottom-[100px] md:bottom-8 left-0 w-full md:left-[240px] md:w-[calc(100%-240px)] p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-40">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { haptics.success(); setStep(5); }}
                    className="pointer-events-auto w-full max-w-lg mx-auto block py-4 rounded-full bg-[#D4FF00] text-black font-bold text-[17px] shadow-[0_0_30px_rgba(212,255,0,0.3)]"
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Customize */}
            {step === 5 && selectedStrategy && (() => {
              const minC = Math.max(1200, tdee - 1000);
              const maxC = tdee + 2000;
              const minP = Math.round(currentWeight * 1.4);
              const maxP = Math.round(currentWeight * 2.5);
              
              const currentCals = typeof customCalories === 'number' ? customCalories : (parseInt(customCalories as string) || minC);
              const currentPro = typeof customProtein === 'number' ? customProtein : (parseInt(customProtein as string) || minP);

              return (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col flex-1 pb-20"
              >
                <div className="text-center mb-8">
                  <h2 className="text-[28px] font-bold tracking-tight text-white mb-3">Want to fine-tune your plan?</h2>
                  <p className="text-[16px] text-[rgba(255,255,255,0.6)]">Adjust your targets below. The AI will recalculate the rest.</p>
                </div>

                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 mb-6">
                  {/* Calories */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[16px] font-semibold text-white">Daily Calories</span>
                      <input 
                        type="number" 
                        value={customCalories === null ? '' : customCalories}
                        onChange={(e) => setCustomCalories(e.target.value)}
                        className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2 w-28 text-right text-[18px] font-bold text-[#D4FF00] focus:outline-none focus:border-[#D4FF00]"
                      />
                    </div>
                    <input 
                      type="range"
                      min={minC}
                      max={maxC}
                      step={10}
                      value={currentCals}
                      onChange={(e) => setCustomCalories(parseInt(e.target.value))}
                      className="w-full h-2 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                    />
                    <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.4)] mt-2 font-medium">
                      <span>{minC} kcal</span>
                      <span>{maxC} kcal</span>
                    </div>
                  </div>

                  {/* Protein */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[16px] font-semibold text-white">Protein (g)</span>
                      <input 
                        type="number" 
                        value={customProtein === null ? '' : customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2 w-28 text-right text-[18px] font-bold text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <input 
                      type="range"
                      min={minP}
                      max={maxP}
                      step={1}
                      value={currentPro}
                      onChange={(e) => setCustomProtein(parseInt(e.target.value))}
                      className="w-full h-2 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.4)] mt-2 font-medium">
                      <span>{minP}g</span>
                      <span>{maxP}g</span>
                    </div>
                  </div>

                  {/* Read-only Fat & Carbs */}
                  <div className="space-y-4 border-t border-[rgba(255,255,255,0.06)] pt-6 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[15px] text-[rgba(255,255,255,0.6)]">Fat (g)</span>
                      <div className="bg-[rgba(0,0,0,0.2)] rounded-xl px-4 py-2 w-24 text-right text-[15px] font-semibold text-[rgba(255,255,255,0.6)]">
                        {customFat}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[15px] text-[rgba(255,255,255,0.6)]">Carbs (g)</span>
                      <div className="bg-[rgba(0,0,0,0.2)] rounded-xl px-4 py-2 w-24 text-right text-[15px] font-semibold text-[rgba(255,255,255,0.6)]">
                        {customCarbs}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[rgba(212,255,0,0.05)] border border-[rgba(212,255,0,0.2)] rounded-2xl p-5 mb-8 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[rgba(212,255,0,0.1)] flex items-center justify-center shrink-0">
                    <span className="text-[18px]">🤖</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-white mb-1">AI Coach Feedback</h4>
                    <p className="text-[13px] text-[rgba(255,255,255,0.7)] leading-relaxed">
                      {currentCals < 1500 ? "This is a very aggressive deficit. Ensure you prioritize protein." : 
                       currentCals > tdee - 200 ? "This is a very small deficit. Progress will be slow but easily sustainable." : 
                       "Great balance. Your protein is sufficient for muscle retention."}
                    </p>
                  </div>
                </div>

                <div className="fixed bottom-[100px] md:bottom-8 left-0 w-full md:left-[240px] md:w-[calc(100%-240px)] p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-40">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      let finalCals = typeof customCalories === 'number' ? customCalories : (parseInt(customCalories as string) || minC);
                      let finalPro = typeof customProtein === 'number' ? customProtein : (parseInt(customProtein as string) || minP);
                      if (finalCals < minC) finalCals = minC;
                      if (finalCals > maxC) finalCals = maxC;
                      if (finalPro < minP) finalPro = minP;
                      if (finalPro > maxP) finalPro = maxP;
                      setCustomCalories(finalCals);
                      setCustomProtein(finalPro);
                      haptics.success(); 
                      setStep(6); 
                    }}
                    className="pointer-events-auto w-full max-w-lg mx-auto block py-4 rounded-full bg-[#D4FF00] text-black font-bold text-[17px] shadow-[0_0_30px_rgba(212,255,0,0.3)]"
                  >
                    Review Final Plan
                  </motion.button>
                </div>
              </motion.div>
              );
            })()}
            {/* STEP 6: Final Review */}
            {step === 6 && selectedStrategy && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col flex-1"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-[rgba(212,255,0,0.1)] text-[#D4FF00] px-4 py-2 rounded-full text-[13px] font-bold uppercase tracking-wider mb-4 border border-[rgba(212,255,0,0.2)]">
                    Your Transformation Plan
                  </div>
                  <h2 className="text-[32px] font-bold tracking-tight text-white leading-tight">Ready to begin?</h2>
                </div>

                <div className="bg-[#111113] border border-[rgba(255,255,255,0.06)] rounded-3xl overflow-hidden mb-8 shadow-2xl relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4FF00] to-transparent opacity-50" />
                  
                  <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center bg-[rgba(255,255,255,0.02)]">
                    <div className="text-center">
                      <div className="text-[12px] text-[rgba(255,255,255,0.5)] font-bold uppercase tracking-wider mb-1">Current</div>
                      <div className="text-[24px] font-bold text-white">{currentBfMid}%</div>
                    </div>
                    <ArrowRight className="text-[rgba(255,255,255,0.2)]" />
                    <div className="text-center">
                      <div className="text-[12px] text-[rgba(255,255,255,0.5)] font-bold uppercase tracking-wider mb-1">Target</div>
                      <div className="text-[24px] font-bold text-[#D4FF00]">{targetBfMid}%</div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-4 gap-2 text-center mb-6">
                      <div>
                        <div className="text-[20px] font-bold text-white mb-1">{customCalories}</div>
                        <div className="text-[11px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider font-semibold">Kcal</div>
                      </div>
                      <div>
                        <div className="text-[20px] font-bold text-[#FF4D1C] mb-1">{customProtein}</div>
                        <div className="text-[11px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider font-semibold">Pro</div>
                      </div>
                      <div>
                        <div className="text-[20px] font-bold text-[#FFD60A] mb-1">{customFat}</div>
                        <div className="text-[11px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider font-semibold">Fat</div>
                      </div>
                      <div>
                        <div className="text-[20px] font-bold text-[#378ADD] mb-1">{customCarbs}</div>
                        <div className="text-[11px] text-[rgba(255,255,255,0.5)] uppercase tracking-wider font-semibold">Carb</div>
                      </div>
                    </div>
                    
                    <div className="bg-[rgba(255,255,255,0.03)] rounded-2xl p-4 border border-[rgba(255,255,255,0.05)]">
                      <p className="text-[14px] text-white leading-relaxed text-center font-medium">
                        If you remain consistent, LeaniQA predicts you'll reach your goal around <span className="text-[#D4FF00]">{selectedStrategy.dateStr}</span>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="fixed bottom-[100px] md:bottom-8 left-0 w-full md:left-[240px] md:w-[calc(100%-240px)] p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-40">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { haptics.success(); handleFinish(); }}
                    disabled={saveMutation.isPending}
                    className="pointer-events-auto w-full max-w-lg mx-auto block py-4 rounded-full bg-white text-black font-bold text-[17px] shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    {saveMutation.isPending ? 'Starting...' : 'Start My Transformation'}
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </Profiler>
  );
}
