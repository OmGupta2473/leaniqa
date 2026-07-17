import React, { Profiler } from 'react';
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/features/profile/store/userStore';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { useAppStore } from '@/app/store';
import { cn } from '@/shared/utils/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { complianceService } from '@/features/reports/services/complianceService';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants, itemVariants, hover, tap } from '@/features/reports/components/motion';
import { ScreenSkeleton } from '@/shared/components/ScreenSkeleton';
import { calculateBodyComposition, calculateGoalStats, estimateBodyFatPercentage } from '@/shared/utils/profileCalculations';
import { BodyFatSelector } from '@/features/goal/components/BodyFatSelector';
import { haptics } from '@/shared/utils/haptics';

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

  const currentBfMid = useUserStore(s => s.goalWizardCurrentBfMid);
  const setCurrentBfMid = useUserStore(s => s.setGoalWizardCurrentBfMid);
  const targetBfMid = useUserStore(s => s.goalWizardTargetBfMid);
  const setTargetBfMid = useUserStore(s => s.setGoalWizardTargetBfMid);

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

  useEffect(() => {
    if (currentBfMid && targetBfMid && targetBfMid >= currentBfMid) {
      setTargetBfMid(null);
    }
  }, [currentBfMid]);

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

  const saveMutation = useMutation({
    mutationFn: async (strategyData: any) => {
      const savedGoal = await profileService.upsertGoal({
        current_bf: strategyData.current_bf,
        target_bf: strategyData.target_bf,
        strategy: strategyData.strategy,
        deficit_kcal: strategyData.deficit_kcal,
        target_date: strategyData.targetDateIso,
        target_weight: strategyData.targetWeightKg
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
        estimatedCompletionDate: data.strategyData.estimatedCompletionDate
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

  const handleChooseStrategy = (strategy: any) => {
    saveMutation.mutate({
      current_bf: currentBfMid,
      target_bf: targetBfMid,
      strategy: strategy.name,
      deficit_kcal: strategy.deficit,
      fatToLoseKg,
      dailyTarget: strategy.dailyTarget,
      targetWeightKg,
      estimatedWeeks: strategy.weeks,
      estimatedCompletionDate: strategy.dateStr,
      targetDateIso: strategy.targetDateIso
    });
  };

  const strategies = targetBfMid === currentBfMid ? [
    {
      name: 'Maintenance',
      deficit: 0,
      pros: 'No deficit needed, full energy',
      cons: 'Requires consistent nutrition discipline',
      proteinNote: `Aim for ${proteinMid || proteinMax}g/day protein to maintain muscle mass`,
      isRecommended: true
    }
  ] : fatToLoseKg > 0 ? [
    {
      name: 'Aggressive',
      deficit: 600,
      pros: 'Fastest route to your goal',
      cons: 'Higher risk of muscle loss',
      proteinNote: `Protein critical — stay above ${proteinMax}g`,
      styleClass: 'border-[rgba(255,77,28,0.25)]',
      activeClass: 'border-[#FF4D1C] bg-[rgba(255,77,28,0.06)] shadow-[0_0_20px_rgba(255,77,28,0.15)]',
    },
    {
      name: 'Recommended',
      deficit: 400,
      isRecommended: true,
      pros: 'Best balance of speed and retention',
      cons: 'Requires consistency',
      proteinNote: `Aim for ${proteinMid || proteinMax}g/day protein`,
      styleClass: 'border-[rgba(212,255,0,0.4)]',
      activeClass: 'border-[#D4FF00] bg-[rgba(212,255,0,0.06)] shadow-[0_0_20px_rgba(212,255,0,0.15)]',
    },
    {
      name: 'Slow & Steady',
      deficit: 200,
      pros: 'Easiest to maintain',
      cons: 'Slowest — requires patience',
      proteinNote: `Target is ${proteinMin || proteinMax}g/day`,
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

  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  
  useEffect(() => {
    if (calculatedStrategies.length > 0 && !selectedStrategy) {
      setSelectedStrategy(calculatedStrategies.find(s => s.isRecommended) || calculatedStrategies[0]);
    } else if (calculatedStrategies.length === 0) {
      setSelectedStrategy(null);
    }
  }, [calculatedStrategies]);

  if (goal) {
    const activeGoal = goal || onboardingData;
    const dailyKcal = profile?.maintenance_kcal && goal?.deficit_kcal !== undefined 
      ? profile.maintenance_kcal - goal.deficit_kcal 
      : activeGoal?.dailyCalorieGoal;

    return (
      <motion.div 
        variants={pageVariants} initial="hidden" animate="visible" exit="exit"
        className="screen-container pt-8 pb-24"
      >
        <div className="flex flex-col items-center justify-center py-10 mb-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#D4FF00] mb-4" />
          <h2 className="text-[28px] font-bold text-white tracking-tight mb-2">Goal Set</h2>
          <p className="text-[14px] text-[rgba(255,255,255,0.5)]">You have already set your physique goal.</p>
        </div>

        <div className="bg-[#111113] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-4">Current Goal Data</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
              <span className="text-[14px] text-[rgba(255,255,255,0.6)]">Current BF%</span>
              <span className="text-[16px] font-medium text-white">{activeGoal?.current_bf || activeGoal?.currentBodyFatPct || '-'}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
              <span className="text-[14px] text-[rgba(255,255,255,0.6)]">Target BF%</span>
              <span className="text-[16px] font-medium text-white">{activeGoal?.target_bf || activeGoal?.targetBodyFatPct || '-'}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
              <span className="text-[14px] text-[rgba(255,255,255,0.6)]">Strategy</span>
              <span className="text-[16px] font-medium text-white">{activeGoal?.strategy || activeGoal?.chosenStrategyName || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-4">
              <span className="text-[14px] text-[rgba(255,255,255,0.6)]">Daily Target</span>
              <span className="text-[16px] font-medium text-white">{dailyKcal || '-'} <span className="text-[12px] text-[rgba(255,255,255,0.4)]">kcal</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-[rgba(255,255,255,0.6)]">Estimated Time</span>
              <span className="text-[16px] font-medium text-white">
                {activeGoal?.deficit_kcal === 0 || activeGoal?.dailyDeficit === 0 ? 'Ongoing' : 
                 activeGoal?.target_date ? new Date(activeGoal.target_date).toLocaleDateString() : 
                 activeGoal?.estimatedWeeks ? `~${activeGoal.estimatedWeeks} weeks` : '-'}
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
                className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-[360px] text-center border border-[rgba(255,255,255,0.1)] shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
              >
                <div className="text-4xl mb-4">⚠️</div>
                <div className="text-[20px] font-bold text-white mb-3 tracking-tight">Reset body goal?</div>
                <div className="text-[14px] text-[rgba(255,255,255,0.6)] leading-relaxed mb-8">
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
                        navigate('/goal');
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
      <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="screen-container pb-28 pt-6">
      
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-[26px] font-semibold text-white tracking-tight -tracking-[0.4px] leading-tight mb-2">Body Goals</h2>
        <p className="text-[15px] text-[rgba(255,255,255,0.8)] tracking-[-0.1px]">Set your target body fat and choose a timeline.</p>
      </motion.div>

      {/* SECTION A */}
      <motion.div variants={itemVariants} className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1">Current Body</h2>
            <h3 className="text-[18px] font-semibold text-white tracking-tight">Select your current physique</h3>
          </div>
          {currentBfMid && <div className="text-[#D4FF00]"><CheckCircle2 size={20} /></div>}
        </div>
        
        <BodyFatSelector 
          gender={gender} 
          estimatedBf={estimatedBf} 
          value={currentBfMid} 
          onChange={setCurrentBfMid} 
        />
      </motion.div>

      {/* SECTION B */}
      <motion.div variants={itemVariants} className={cn("mb-10 transition-all duration-300", !currentBfMid ? "opacity-30 pointer-events-none grayscale" : "opacity-100")}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1">Target Body</h2>
            <h3 className="text-[18px] font-semibold text-white tracking-tight">Now choose your target</h3>
          </div>
          {targetBfMid && <div className="text-[#D4FF00]"><CheckCircle2 size={20} /></div>}
        </div>

        {currentBfMid === 2.5 && (
          <div className="text-[14px] font-medium text-[#D4FF00] mb-4 p-4 bg-[rgba(212,255,0,0.08)] border border-[rgba(212,255,0,0.4)] rounded-xl">
            You're already at elite level. Only maintenance is available.
          </div>
        )}

        <div className="mb-4">
          <BodyFatSelector 
            gender={gender} 
            value={targetBfMid} 
            onChange={setTargetBfMid} 
            maxBf={currentBfMid}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {currentBfMid && (
            <motion.button
              key="maintain"
              onClick={() => setTargetBfMid(currentBfMid)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "bg-[#111113] border-[0.5px] border-[rgba(255,255,255,0.06)] rounded-2xl p-4 cursor-pointer transition-all duration-200 text-left flex flex-col hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)]",
                targetBfMid === currentBfMid && "border-[#D4FF00] bg-[rgba(212,255,0,0.06)] shadow-[0_0_20px_rgba(212,255,0,0.15)] hover:border-[#D4FF00]"
              )}
            >
              <div className={cn("text-[20px] font-bold tracking-tight mb-1", targetBfMid === currentBfMid ? "text-[#D4FF00]" : "text-white")}>Maintain</div>
              <div className="text-[13px] font-medium text-[rgba(255,255,255,0.8)] mb-1">Stay at {currentBfMid}%</div>
              <div className="text-[11px] text-[rgba(255,255,255,0.45)] leading-relaxed">Keep your current physique</div>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* SECTION C */}
      <motion.div variants={itemVariants} className={cn("transition-all duration-300", (!currentBfMid || !targetBfMid) ? "opacity-30 pointer-events-none grayscale" : "opacity-100")}>
        <div className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1">Plan Strategy</h2>
          <h3 className="text-[18px] font-semibold text-white tracking-tight">How do you want to get there?</h3>
        </div>

        {currentBfMid && targetBfMid && targetBfMid > currentBfMid && (
          <div className="text-[14px] text-[#FF3B30] flex items-center gap-2 mb-4 p-4 bg-[rgba(255,59,48,0.05)] border border-[rgba(255,59,48,0.6)] rounded-xl">
            <AlertTriangle size={16} /> Target body fat must be lower than current.
          </div>
        )}

        {currentBfMid && targetBfMid && targetBfMid <= currentBfMid && calculatedStrategies.length > 0 && (
          <div className="space-y-6">
            
            {fatToLoseKg > 0 && (
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {calculatedStrategies.map((s) => {
                  const isSelected = selectedStrategy?.name === s.name;
                  return (
                    <motion.button 
                      key={s.name}
                      onClick={() => setSelectedStrategy(s)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative bg-[#111113] border-[0.5px] rounded-xl p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)]",
                        isSelected ? s.activeClass : "border-[rgba(255,255,255,0.06)]"
                      )}
                    >
                      {s.isRecommended && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#D4FF00] text-black text-[7px] font-extrabold uppercase px-2 py-0.5 rounded-full whitespace-nowrap tracking-wide">
                          Best
                        </div>
                      )}
                      <div className="text-[12px] font-semibold text-white mb-1 leading-tight">{s.name}</div>
                      <div className="text-[11px] text-[rgba(255,255,255,0.5)]">-{s.deficit} kcal</div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {selectedStrategy && (
              <motion.div 
                key={selectedStrategy.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-lime overflow-hidden"
              >
                <div className="p-6 text-center border-b border-[rgba(212,255,0,0.1)]">
                  <div className="text-[36px] font-bold text-[#D4FF00] tracking-[-1px] leading-none mb-1">
                    {selectedStrategy.deficit === 0 ? 'Maintenance' : (
                      <><AnimatedNumber value={selectedStrategy.weeks} /> weeks</>
                    )}
                  </div>
                  <div className="text-[13px] text-[rgba(255,255,255,0.5)]">
                    {selectedStrategy.deficit === 0 ? 'Keep your current physique' : `Estimated completion by ${selectedStrategy.dateStr}`}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-[rgba(255,255,255,0.5)]">Daily Target</span>
                    <span className="font-semibold text-white">{selectedStrategy.dailyTarget} kcal</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-[rgba(255,255,255,0.5)]">Pros</span>
                    <span className="font-medium text-white text-right max-w-[60%]">{selectedStrategy.pros}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-[rgba(255,255,255,0.5)]">Cons</span>
                    <span className="font-medium text-[rgba(255,255,255,0.8)] text-right max-w-[60%]">{selectedStrategy.cons}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedStrategy && (
              <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <motion.button 
                  whileHover={hover.glow}
                  whileTap={tap.scale}
                  onClick={() => handleChooseStrategy(selectedStrategy)}
                  disabled={saveMutation.isPending}
                  className="btn-primary w-full max-w-[400px] mx-auto block"
                >
                  {saveMutation.isPending ? 'Saving...' : `Start ${selectedStrategy.name} Plan`}
                </motion.button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
    </Profiler>
  );
}
