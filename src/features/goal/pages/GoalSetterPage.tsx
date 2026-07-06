import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAppStore } from '@/app/store';
import { cn } from '@/shared/utils/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { complianceService } from '@/features/reports/services/complianceService';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const bodyFatOptions = [
  { range: 'Under 5%', label: 'Essential fat', desc: 'Extremely lean, visible striations, competition level', mid: 2.5 },
  { range: '5–10%', label: 'Athletic', desc: 'Visible abs, very defined, typical fitness model', mid: 7.5 },
  { range: '10–15%', label: 'Fit', desc: 'Some ab definition, lean look, low belly fat', mid: 12.5 },
  { range: '15–20%', label: 'Average fit', desc: 'Slight belly, face looks lean, no visible abs', mid: 17.5 },
  { range: '20–30%', label: 'Average', desc: 'Soft belly, fuller face, no muscle definition', mid: 25 },
  { range: '30–40%', label: 'Above average', desc: 'Noticeable belly, rounder build, low energy common', mid: 35 },
  { range: 'Above 40%', label: 'High body fat', desc: 'Significant fat storage across the whole body', mid: 45 }
];

const Silhouette = ({ active }: { active: boolean }) => (
  <div className={cn("flex justify-center items-center py-2 mb-2 opacity-80", active ? "text-[#D4FF00]" : "text-[#EBEBF599]")}>
    <svg width="40" height="60" viewBox="0 0 24 36" fill="currentColor">
      <path d="M12,2 C10.3431458,2 9,3.34314575 9,5 C9,6.65685425 10.3431458,8 12,8 C13.6568542,8 15,6.65685425 15,5 C15,3.34314575 13.6568542,2 12,2 Z M8,9 C6.34314575,9 5,10.3431458 5,12 L5,20 C5,21.1045695 5.8954305,22 7,22 L7,34 C7,35.1045695 7.8954305,36 9,36 L11,36 C11.5522847,36 12,35.5522847 12,35 L12,24 L13,24 L13,35 C13,35.5522847 13.4477153,36 14,36 L16,36 C17.1045695,36 18,35.1045695 18,34 L18,22 C19.1045695,22 20,21.1045695 20,20 L20,12 C20,10.3431458 18.6568542,9 17,9 L8,9 Z" />
    </svg>
  </div>
);

export function GoalSetterPage() {
  const navigate = useNavigate();
  const onboardingData = useUserStore(s => s.onboardingData);
  const setOnboardingData = useUserStore(s => s.setOnboardingData);
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const resetGoalConfirm = activeModal === 'reset_goal_confirm';
  const setResetGoalConfirm = (isOpen: boolean) => setActiveModal(isOpen ? 'reset_goal_confirm' : null);
  
  const currentBfMid = useUserStore(s => s.goalWizardCurrentBfMid);
  const setCurrentBfMid = useUserStore(s => s.setGoalWizardCurrentBfMid);
  const targetBfMid = useUserStore(s => s.goalWizardTargetBfMid);
  const setTargetBfMid = useUserStore(s => s.setGoalWizardTargetBfMid);

  const tdee = onboardingData?.tdee || profile?.maintenance_kcal || 2500;
  const currentWeight = onboardingData?.weightKg || profile?.weight || 80;
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
    currentFatMass = currentWeight * (currentBfMid / 100);
  }

  if (currentBfMid && targetBfMid) {
    const leanMassKg = currentWeight * (1 - currentBfMid / 100);
    targetWeightKg = Math.round((leanMassKg / (1 - targetBfMid / 100)) * 10) / 10;
    targetFatMass = Math.round((targetWeightKg * (targetBfMid / 100)) * 10) / 10;
    fatToLoseKg = Math.round((currentWeight - targetWeightKg) * 10) / 10;
  }

  const saveMutation = useMutation({
    mutationFn: async (strategyData: any) => {
      const savedGoal = await profileService.upsertGoal({
        current_bf: strategyData.current_bf,
        target_bf: strategyData.target_bf,
        strategy: strategyData.strategy,
        deficit_kcal: strategyData.deficit_kcal,
        target_date: strategyData.targetDateIso
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
      name: 'Aggressive Cut',
      deficit: 600,
      pros: 'Fastest route to your goal',
      cons: 'Higher risk of muscle loss, fatigue, harder to sustain',
      proteinNote: `Protein becomes critical — stay above ${proteinMax}g/day to protect muscle`,
      styleClass: 'bg-[rgba(255,77,28,0.08)] border-[0.5px] border-[rgba(255,77,28,0.25)]',
      btnClass: 'bg-[rgba(255,255,255,0.1)] text-white border-[0.5px] border-[rgba(255,255,255,0.2)] rounded-[100px] p-[14px_28px] font-semibold text-[15px]'
    },
    {
      name: 'Recommended',
      deficit: 400,
      isRecommended: true,
      pros: 'Best balance of speed and muscle retention',
      cons: 'Requires consistency but very sustainable',
      proteinNote: `Aim for ${proteinMid || proteinMax}g/day protein — muscle loss is minimal at this pace`,
      styleClass: 'bg-[rgba(212,255,0,0.08)] border-[1.5px] border-[rgba(212,255,0,0.4)]',
      btnClass: 'bg-[#D4FF00] text-[#0A0A0A] font-bold text-[17px] rounded-[100px] p-[16px_32px] border-none tracking-[-0.2px] hover:scale-[1.02] hover:opacity-[0.95] active:scale-[0.97]'
    },
    {
      name: 'Steady & Sustainable',
      deficit: 200,
      pros: 'Easiest to maintain, almost no muscle loss risk',
      cons: 'Slowest — requires patience and long-term commitment',
      proteinNote: `Protein target is ${proteinMin || proteinMax}g/day — muscle preservation is excellent`,
      styleClass: 'bg-[rgba(55,138,221,0.08)] border-[0.5px] border-[rgba(55,138,221,0.25)]',
      btnClass: 'bg-[rgba(255,255,255,0.1)] text-white border-[0.5px] border-[rgba(255,255,255,0.2)] rounded-[100px] p-[14px_28px] font-semibold text-[15px]'
    }
  ] : [];

  const calculatedStrategies = strategies.map(s => {
    const dailyTarget = Math.round((tdee - s.deficit) / 10) * 10;
    const weeklyRate = s.deficit > 0 ? (s.deficit * 7) / 7700 : 0;
    const weeks = s.deficit > 0 ? Math.round(fatToLoseKg / weeklyRate) : 0;
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeks * 7);
    const dateStr = s.deficit > 0 ? targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Ongoing';
    const targetDateIso = targetDate.toISOString().split('T')[0];

    return {
      ...s,
      dailyTarget,
      weeks,
      dateStr,
      targetDateIso
    };
  });

  if (goal) {
    const activeGoal = goal || onboardingData;
    const dailyKcal = profile?.maintenance_kcal && goal?.deficit_kcal !== undefined 
      ? profile.maintenance_kcal - goal.deficit_kcal 
      : activeGoal?.dailyCalorieGoal;

    return (
      <div className="screen-container animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-[#D4FF00] mx-auto mb-4" />
          <h2 className="text-[34px] font-bold text-white tracking-[-0.5px] mb-2">Goal Set</h2>
          <p className="text-[15px] font-normal tracking-[-0.1px] text-[#EBEBF5CC]">You have already set your physique goal.</p>
        </div>

        <div className="glass-card p-[16px_20px] mb-6">
          <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[#EBEBF599] mb-[12px]">Current Goal Data</h3>
          <div className="space-y-[12px]">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Current BF%</span>
              <span className="text-[17px] font-semibold text-white">{activeGoal?.current_bf || activeGoal?.currentBodyFatPct || '-'}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Target BF%</span>
              <span className="text-[17px] font-semibold text-white">{activeGoal?.target_bf || activeGoal?.targetBodyFatPct || '-'}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Strategy</span>
              <span className="text-[17px] font-semibold text-white">{activeGoal?.strategy || activeGoal?.chosenStrategyName || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Daily Target</span>
              <span className="text-[17px] font-semibold text-white">{dailyKcal || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">kcal</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Estimated Time</span>
              <span className="text-[17px] font-semibold text-white">
                {activeGoal?.deficit_kcal === 0 || activeGoal?.dailyDeficit === 0 ? 'Ongoing' : 
                 activeGoal?.target_date ? new Date(activeGoal.target_date).toLocaleDateString() : 
                 activeGoal?.estimatedWeeks ? `~${activeGoal.estimatedWeeks} weeks` : '-'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setResetGoalConfirm(true)}
          className="w-full py-[14px] bg-[rgba(255,255,255,0.1)] text-white font-semibold text-[15px] rounded-[100px] border-[0.5px] border-[rgba(255,255,255,0.2)] transition-transform active:scale-[0.96]"
        >
          Reset goal
        </button>
        
        {resetGoalConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ background: '#1C1C1E', borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '360px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '12px', letterSpacing: '-0.4px' }}>
                Reset body goal?
              </div>
              <div style={{ fontSize: '15px', color: 'rgba(235,235,245,0.6)', lineHeight: 1.5, marginBottom: '32px' }}>
                This will permanently erase your target body fat, strategy, and timeline. Your meal history and body stats will remain. This cannot be undone.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => setResetGoalConfirm(false)}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: '100px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '0.5px solid rgba(255,255,255,0.2)',
                    color: 'white', fontWeight: 600,
                    fontSize: 'var(--font-md)', cursor: 'pointer'
                  }}
                >
                  Keep my goal
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await profileService.deleteGoal();
                      setResetGoalConfirm(false);
                      queryClient.setQueryData(['goal'], null);
                      navigate('/goal');
                    } catch { alert('Failed to reset goal. Try again.'); }
                  }}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: '100px',
                    background: '#FF3B30',
                    border: 'none',
                    color: 'white', fontWeight: 700,
                    fontSize: 'var(--font-md)', cursor: 'pointer'
                  }}
                >
                  Yes, reset goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="screen-container screen-enter">
      <div className="py-[28px] mb-[12px]">
        <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mb-[8px]">Step 2 of 2</div>
        <h2 className="text-[34px] font-bold text-white tracking-[-0.5px] leading-tight mb-[8px]">Body Goals</h2>
        <p className="text-[15px] font-normal text-[#EBEBF5CC] tracking-[-0.1px]">Set your target body fat and choose a timeline.</p>
      </div>

      {/* SECTION A */}
      <div className="mb-[28px]">
        <div className="flex items-center gap-2 mb-[12px] mt-[28px]">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599]">Current Body</h2>
          {currentBfMid && <div className="flex items-center gap-1 text-[#D4FF00] text-[11px] font-bold uppercase tracking-widest bg-[rgba(212,255,0,0.1)] px-2 py-0.5 rounded-full"><CheckCircle2 size={12} /> Step complete</div>}
        </div>
        <h3 className="text-[22px] font-semibold text-white tracking-[-0.3px] mb-1">Select your current physique</h3>
        <p className="text-[15px] text-[#EBEBF5CC] mb-4 tracking-[-0.1px]">This helps us calculate how much fat you're actually carrying</p>
        
        <div className="flex gap-[12px] overflow-x-auto pb-4 snap-x hide-scrollbar touch-pan-x">
          {bodyFatOptions.map((opt) => (
            <button
              key={opt.range}
              onClick={() => setCurrentBfMid(opt.mid)}
              className={cn(
                "bf-card flex-none w-[clamp(160px,44vw,200px)] p-[16px] rounded-[16px] cursor-pointer transition-all snap-start flex flex-col text-left",
                currentBfMid === opt.mid 
                  ? "bg-[rgba(212,255,0,0.1)] border-[1.5px] border-[#D4FF00] scale-[1.03]" 
                  : "bg-[rgba(44,44,46,0.7)] border-[0.5px] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(44,44,46,0.9)]"
              )}
            >
              <Silhouette active={currentBfMid === opt.mid} />
              <div className="mt-2 text-[28px] font-bold text-white tracking-[-0.5px]">{opt.range}</div>
              <div className="text-[15px] font-semibold text-[#EBEBF5CC] mt-1">{opt.label}</div>
              <div className="text-[12px] font-normal text-[#EBEBF599] mt-2 leading-relaxed">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION B */}
      <div className={cn("mb-[28px] transition-all duration-300", !currentBfMid ? "opacity-[0.35] pointer-events-none grayscale-[0.5]" : "opacity-100 card-reveal")}>
        <div className="flex items-center gap-2 mb-[12px] mt-[28px]">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599]">Target Body</h2>
          {targetBfMid && <div className="flex items-center gap-1 text-[#D4FF00] text-[11px] font-bold uppercase tracking-widest bg-[rgba(212,255,0,0.1)] px-2 py-0.5 rounded-full"><CheckCircle2 size={12} /> Step complete</div>}
        </div>
        <h3 className="text-[22px] font-semibold text-white tracking-[-0.3px] mb-1">Now choose your target</h3>
        <p className="text-[15px] text-[#EBEBF5CC] mb-4 tracking-[-0.1px]">You can only target a lower body fat % than where you are now</p>

        {currentBfMid === 2.5 && (
          <div className="text-[15px] font-medium text-[#D4FF00] flex items-center gap-2 mb-4 p-[16px] bg-[rgba(212,255,0,0.08)] border border-[rgba(212,255,0,0.4)] rounded-xl">
            You're already at elite level. Only maintenance is available.
          </div>
        )}

        <div className="flex gap-[12px] overflow-x-auto pb-4 snap-x hide-scrollbar touch-pan-x">
          {bodyFatOptions.filter(opt => !currentBfMid || opt.mid < currentBfMid).map((opt) => (
            <button
              key={opt.range}
              onClick={() => setTargetBfMid(opt.mid)}
              className={cn(
                "bf-card flex-none w-[clamp(160px,44vw,200px)] p-[16px] rounded-[16px] cursor-pointer transition-all snap-start flex flex-col text-left",
                targetBfMid === opt.mid 
                  ? "bg-[rgba(212,255,0,0.1)] border-[1.5px] border-[#D4FF00] scale-[1.03]" 
                  : "bg-[rgba(44,44,46,0.7)] border-[0.5px] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(44,44,46,0.9)]"
              )}
            >
              <Silhouette active={targetBfMid === opt.mid} />
              <div className="mt-2 text-[28px] font-bold text-white tracking-[-0.5px]">{opt.range}</div>
              <div className="text-[15px] font-semibold text-[#EBEBF5CC] mt-1">{opt.label}</div>
              <div className="text-[12px] font-normal text-[#EBEBF599] mt-2 leading-relaxed">{opt.desc}</div>
            </button>
          ))}
          {currentBfMid && (
            <button
              key="maintain"
              onClick={() => setTargetBfMid(currentBfMid)}
              className={cn(
                "bf-card flex-none w-[clamp(160px,44vw,200px)] p-[16px] rounded-[16px] cursor-pointer transition-all snap-start flex flex-col text-left",
                targetBfMid === currentBfMid 
                  ? "bg-[rgba(212,255,0,0.1)] border-[1.5px] border-[#D4FF00] scale-[1.03]" 
                  : "bg-[rgba(44,44,46,0.7)] border-[0.5px] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(44,44,46,0.9)]"
              )}
            >
              <Silhouette active={targetBfMid === currentBfMid} />
              <div className="mt-2 text-[22px] font-bold text-white tracking-[-0.5px] leading-tight mb-[6px]">Maintain current</div>
              <div className="text-[15px] font-semibold text-[#EBEBF5CC] mt-1">Stay at {currentBfMid}%</div>
              <div className="text-[12px] font-normal text-[#EBEBF599] mt-2 leading-relaxed">Keep your current physique and maintain weight</div>
            </button>
          )}
        </div>

        {currentBfMid && targetBfMid && targetBfMid < currentBfMid && (
          <div className="glass-card p-[16px_20px] mt-[12px] animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-y-[16px] gap-x-[20px]">
              <div>
                <div className="text-[13px] font-medium text-[#EBEBF599] uppercase tracking-[0.05em] mb-[4px]">Current</div>
                <div className="text-[17px] font-semibold text-white">{currentBfMid}% <span className="text-[15px] text-[#EBEBF5CC] font-normal">({currentFatMass.toFixed(1)}kg fat)</span></div>
              </div>
              <div>
                <div className="text-[13px] font-medium text-[#EBEBF599] uppercase tracking-[0.05em] mb-[4px]">Target</div>
                <div className="text-[17px] font-semibold text-white">{targetBfMid}% <span className="text-[15px] text-[#EBEBF5CC] font-normal">({targetFatMass.toFixed(1)}kg fat)</span></div>
              </div>
              <div>
                <div className="text-[13px] font-medium text-[#EBEBF599] uppercase tracking-[0.05em] mb-[4px]">Fat to lose</div>
                <div className="text-[17px] font-semibold text-[#FF4D1C]">{fatToLoseKg.toFixed(1)} kg</div>
              </div>
              <div>
                <div className="text-[13px] font-medium text-[#EBEBF599] uppercase tracking-[0.05em] mb-[4px]">New body weight</div>
                <div className="text-[17px] font-semibold text-white">~{targetWeightKg.toFixed(1)} kg</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION C */}
      <div className={cn("transition-all duration-300", (!currentBfMid || !targetBfMid) ? "opacity-[0.35] pointer-events-none grayscale-[0.5]" : "opacity-100")}>
        <div className="flex items-center gap-2 mb-[12px] mt-[28px]">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599]">Plan Strategy</h2>
        </div>
        <h3 className="text-[22px] font-semibold text-white tracking-[-0.3px] mb-1">How do you want to get there?</h3>
        <p className="text-[15px] text-[#EBEBF5CC] mb-4 tracking-[-0.1px]">Each approach has a different speed, risk, and lifestyle demand</p>

        {currentBfMid && targetBfMid && targetBfMid > currentBfMid && (
          <div className="text-[15px] text-[#FF3B30] flex items-center gap-2 mb-4 p-[16px] bg-[rgba(255,59,48,0.05)] border border-[rgba(255,59,48,0.6)] rounded-xl">
            <AlertTriangle size={16} /> Please select a target body fat % lower than or equal to your current level.
          </div>
        )}

        {currentBfMid && targetBfMid && targetBfMid <= currentBfMid && (
          <div className="flex flex-col gap-[16px]">
            {calculatedStrategies.map((s, i) => (
            <div 
              key={s.name} 
              className={cn(
                "strategy-card card-reveal relative flex flex-col p-[20px_24px] rounded-[16px]",
                s.styleClass || "glass-card"
              )}
            >
              {s.isRecommended && (
                <div className="absolute top-[-10px] right-[24px]">
                  <div className="bg-[#D4FF00] text-[#0A0A0A] text-[11px] font-bold px-[10px] py-[4px] rounded-[100px] shadow-sm uppercase tracking-[0.04em]">
                    Recommended
                  </div>
                </div>
              )}
              
              <div className="mb-[16px]">
                <h3 className="text-[17px] font-semibold text-white mb-[8px] tracking-[-0.2px]">{s.name}</h3>
                <div className="flex items-baseline gap-[8px]">
                  <span className="text-[40px] font-bold tracking-[-1px] text-white leading-none">{s.dailyTarget}</span>
                  <span className="text-[15px] text-[#EBEBF5CC] font-medium">kcal/day</span>
                </div>
                <div className="text-[15px] text-[#EBEBF5CC] mt-[4px] border-b border-[rgba(255,255,255,0.1)] pb-[16px]">
                  {s.deficit} kcal deficit
                </div>
              </div>

              <div className="mb-[16px]">
                <div className="text-[17px] font-semibold text-white mb-[4px]">
                  {s.deficit === 0 ? (
                    <span className="text-[#D4FF00]">Ongoing Maintenance</span>
                  ) : (
                    <>~{s.weeks} weeks <span className="text-[#EBEBF599] font-normal text-[15px]">(by {s.dateStr})</span></>
                  )}
                </div>
              </div>

              <div className="flex-grow flex flex-col gap-[12px] mb-[20px]">
                <div className="flex items-start gap-[12px]">
                  <div className="bg-[rgba(255,255,255,0.1)] rounded-full p-[2px] shrink-0 mt-[2px]">
                    <CheckCircle2 size={16} className="text-white" />
                  </div>
                  <span className="text-[15px] text-white font-normal leading-[1.4]">{s.pros}</span>
                </div>
                <div className="flex items-start gap-[12px]">
                  <div className="bg-[rgba(255,77,28,0.1)] rounded-full p-[2px] shrink-0 mt-[2px]">
                    <AlertTriangle size={16} className="text-[#FF4D1C]" />
                  </div>
                  <span className="text-[15px] text-[#EBEBF5CC] font-normal leading-[1.4]">{s.cons}</span>
                </div>
              </div>

              <div className="bg-[rgba(255,255,255,0.05)] p-[12px_16px] text-[13px] text-[#EBEBF5CC] leading-[1.4] mb-[20px] border border-[rgba(255,255,255,0.1)] rounded-[12px]">
                <span className="font-semibold text-white block mb-[2px]">Protein Note</span>
                {s.proteinNote}
              </div>

              <button 
                onClick={() => handleChooseStrategy(s)}
                disabled={saveMutation.isPending}
                className={cn(
                  "w-full transition-transform active:scale-[0.96] flex items-center justify-center gap-[8px] group",
                  s.btnClass || "bg-[rgba(255,255,255,0.1)] text-white border-[0.5px] border-[rgba(255,255,255,0.2)] rounded-[100px] p-[14px_28px] font-semibold text-[15px]"
                )}
              >
                {saveMutation.isPending ? 'Saving...' : 'Choose this plan'}
                {s.isRecommended && <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-[3px]" />}
              </button>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
