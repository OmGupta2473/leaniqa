import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { complianceService } from '../services/complianceService';
import { Lock, Check, AlertTriangle } from 'lucide-react';

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
  <div className={cn("flex justify-center items-center py-2 mb-2 opacity-80", active ? "text-purple" : "text-text-tertiary")}>
    <svg width="40" height="60" viewBox="0 0 24 36" fill="currentColor">
      <path d="M12,2 C10.3431458,2 9,3.34314575 9,5 C9,6.65685425 10.3431458,8 12,8 C13.6568542,8 15,6.65685425 15,5 C15,3.34314575 13.6568542,2 12,2 Z M8,9 C6.34314575,9 5,10.3431458 5,12 L5,20 C5,21.1045695 5.8954305,22 7,22 L7,34 C7,35.1045695 7.8954305,36 9,36 L11,36 C11.5522847,36 12,35.5522847 12,35 L12,24 L13,24 L13,35 C13,35.5522847 13.4477153,36 14,36 L16,36 C17.1045695,36 18,35.1045695 18,34 L18,22 C19.1045695,22 20,21.1045695 20,20 L20,12 C20,10.3431458 18.6568542,9 17,9 L8,9 Z" />
    </svg>
  </div>
);

export function GoalSetterScreen() {
  const { setScreen, onboardingData, setOnboardingData } = useAppStore();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  
  const [currentBfMid, setCurrentBfMid] = useState<number | null>(null);
  const [targetBfMid, setTargetBfMid] = useState<number | null>(null);

  const tdee = onboardingData?.tdee || profile?.maintenance_kcal || 2500;
  const currentWeight = onboardingData?.weightKg || profile?.weight || 80;
  const proteinMax = onboardingData?.proteinMax || 160;
  const proteinMid = onboardingData?.proteinMid || 150;
  const proteinMin = onboardingData?.proteinMin || 140;

  // Clear target if current changes to be <= target
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
    onSuccess: (data) => {
      console.log('Navigating to Screen 3');
      if (data.savedGoal) {
        queryClient.setQueryData(['goal'], data.savedGoal);
      } else {
        queryClient.invalidateQueries({ queryKey: ['goal'] });
      }
      complianceService.updateTodayScore().then(() => {
        queryClient.invalidateQueries({ queryKey: ['complianceScore'] });
      }).catch(console.error);
      
      // Pass accumulated user data
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
      setScreen('dash');
    },
    onError: (error) => {
      console.error("saveMutation error:", error);
      alert("Failed to save goal: " + error.message);
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

  const strategies = fatToLoseKg > 0 ? [
    {
      name: 'Aggressive Cut',
      deficit: 600,
      tagColor: 'text-amber',
      tagBg: 'bg-amber-bg',
      tagBorder: 'border-amber/20',
      pros: 'Fastest route to your goal',
      cons: 'Higher risk of muscle loss, fatigue, harder to sustain',
      proteinNote: `Protein becomes critical — stay above ${proteinMax}g/day to protect muscle`
    },
    {
      name: 'Recommended',
      deficit: 400,
      tagColor: 'text-green',
      tagBg: 'bg-green-bg',
      tagBorder: 'border-green',
      isRecommended: true,
      pros: 'Best balance of speed and muscle retention',
      cons: 'Requires consistency but very sustainable',
      proteinNote: `Aim for ${proteinMid || proteinMax}g/day protein — muscle loss is minimal at this pace`
    },
    {
      name: 'Steady & Sustainable',
      deficit: 200,
      tagColor: 'text-blue',
      tagBg: 'bg-blue-bg',
      tagBorder: 'border-blue/20',
      pros: 'Easiest to maintain, almost no muscle loss risk',
      cons: 'Slowest — requires patience and long-term commitment',
      proteinNote: `Protein target is ${proteinMin || proteinMax}g/day — muscle preservation is excellent`
    }
  ] : [];

  const calculatedStrategies = strategies.map(s => {
    const dailyTarget = Math.round((tdee - s.deficit) / 10) * 10;
    const weeklyRate = (s.deficit * 7) / 7700;
    const weeks = Math.round(fatToLoseKg / weeklyRate);
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeks * 7);
    const dateStr = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const targetDateIso = targetDate.toISOString().split('T')[0];

    return {
      ...s,
      dailyTarget,
      weeks,
      dateStr,
      targetDateIso
    };
  });

  return (
    <div className="pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-center py-4 pb-5">
        <div className="text-[10px] text-purple font-bold tracking-widest uppercase mb-2">Step 2 of 2</div>
        <h2 className="text-[20px] font-medium text-text-primary mb-1.5">Physique Goals</h2>
        <p className="text-[13px] text-text-secondary max-w-[320px] mx-auto">Set your target body fat and choose a timeline.</p>
      </div>

      {/* SECTION A */}
      <div className="mb-8">
        <h2 className="text-[16px] font-medium text-text-primary mb-1">Select the image that looks most like your current body</h2>
        <p className="text-[13px] text-text-secondary mb-4">This helps us calculate how much fat you're actually carrying</p>
        
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {bodyFatOptions.map((opt) => (
            <button
              key={opt.range}
              onClick={() => setCurrentBfMid(opt.mid)}
              className={cn(
                "flex-none w-[180px] p-4 border-[0.5px] cursor-pointer transition-all snap-center flex flex-col text-left",
                currentBfMid === opt.mid 
                  ? "border-blue bg-blue-bg border-2 ring-0" 
                  : "border-border-secondary bg-background-primary hover:bg-background-secondary"
              )}
            >
              <Silhouette active={currentBfMid === opt.mid} />
              <div className="mt-2 text-[16px] font-bold text-text-primary">{opt.range}</div>
              <div className="text-[13px] font-medium text-text-secondary mt-1">{opt.label}</div>
              <div className="text-[11px] text-text-tertiary mt-2 leading-relaxed">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION B */}
      <div className={cn("mb-8 transition-opacity duration-300", !currentBfMid ? "opacity-40 pointer-events-none" : "opacity-100")}>
        <div className="flex items-center gap-2 mb-1">
          {!currentBfMid && <Lock size={16} className="text-text-secondary" />}
          <h2 className="text-[16px] font-medium text-text-primary">Now choose your target physique</h2>
        </div>
        <p className="text-[13px] text-text-secondary mb-4">You can only target a lower body fat % than where you are now</p>

        {!currentBfMid && (
          <div className="text-[13px] text-text-secondary flex items-center gap-1 mb-4 p-3 bg-background-secondary border border-border-secondary">
            <Lock size={14} /> Complete the step above first
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {bodyFatOptions.filter(opt => !currentBfMid || opt.mid < currentBfMid).map((opt) => (
            <button
              key={opt.range}
              onClick={() => setTargetBfMid(opt.mid)}
              className={cn(
                "flex-none w-[180px] p-4 border-[0.5px] cursor-pointer transition-all snap-center flex flex-col text-left",
                targetBfMid === opt.mid 
                  ? "border-blue bg-blue-bg border-2 ring-0" 
                  : "border-border-secondary bg-background-primary hover:bg-background-secondary"
              )}
            >
              <Silhouette active={targetBfMid === opt.mid} />
              <div className="mt-2 text-[16px] font-bold text-text-primary">{opt.range}</div>
              <div className="text-[13px] font-medium text-text-secondary mt-1">{opt.label}</div>
              <div className="text-[11px] text-text-tertiary mt-2 leading-relaxed">{opt.desc}</div>
            </button>
          ))}
        </div>

        {currentBfMid && targetBfMid && targetBfMid < currentBfMid && (
          <div className="bg-background-secondary border border-border-tertiary p-4 mt-2 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <div className="text-[11px] text-text-secondary uppercase tracking-widest mb-1">Current</div>
                <div className="text-[13px] font-medium text-text-primary">{currentBfMid}% body fat <span className="text-[11px] text-text-secondary font-normal">({currentFatMass.toFixed(1)} kg fat mass)</span></div>
              </div>
              <div>
                <div className="text-[11px] text-text-secondary uppercase tracking-widest mb-1">Target</div>
                <div className="text-[13px] font-medium text-text-primary">{targetBfMid}% body fat <span className="text-[11px] text-text-secondary font-normal">({targetFatMass.toFixed(1)} kg fat mass)</span></div>
              </div>
              <div>
                <div className="text-[11px] text-text-secondary uppercase tracking-widest mb-1">Fat to lose</div>
                <div className="text-[13px] font-medium text-text-primary">{fatToLoseKg.toFixed(1)} kg</div>
              </div>
              <div>
                <div className="text-[11px] text-text-secondary uppercase tracking-widest mb-1">New target body weight</div>
                <div className="text-[13px] font-medium text-text-primary">~{targetWeightKg.toFixed(1)} kg</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION C */}
      <div className={cn("transition-opacity duration-300", (!currentBfMid || !targetBfMid) ? "opacity-40 pointer-events-none" : "opacity-100")}>
        <div className="flex items-center gap-2 mb-1">
          {(!currentBfMid || !targetBfMid) && <Lock size={16} className="text-text-secondary" />}
          <h2 className="text-[16px] font-medium text-text-primary">How do you want to get there?</h2>
        </div>
        <p className="text-[13px] text-text-secondary mb-4">Each approach has a different speed, risk, and lifestyle demand</p>

        {(!currentBfMid || !targetBfMid) && (
          <div className="text-[13px] text-text-secondary flex items-center gap-1 mb-4 p-3 bg-background-secondary border border-border-secondary">
            <Lock size={14} /> Complete the step above first
          </div>
        )}

        {currentBfMid && targetBfMid && targetBfMid >= currentBfMid && (
          <div className="text-[13px] text-coral flex items-center gap-1 mb-4 p-3 bg-coral/10 border border-coral/20">
            <AlertTriangle size={14} /> Please select a target body fat % lower than your current level.
          </div>
        )}

        {currentBfMid && targetBfMid && targetBfMid < currentBfMid && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {calculatedStrategies.map((s) => (
            <div 
              key={s.name} 
              className={cn(
                "relative flex flex-col bg-background-primary border-[0.5px] p-5",
                s.isRecommended ? "border-2 border-green" : "border-border-secondary"
              )}
            >
              {s.isRecommended && (
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2">
                  <div className="bg-green text-background-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm">
                    Recommended
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-[16px] font-bold text-text-primary">{s.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-[32px] font-bold tracking-tight text-text-primary leading-none">{s.dailyTarget}</span>
                  <span className="text-[13px] text-text-secondary font-medium">kcal/day</span>
                </div>
                <div className="text-[12px] text-text-secondary mt-1 border-b border-border-tertiary pb-4">
                  {s.deficit} kcal deficit
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[12px] font-medium text-text-primary mb-1">
                  ~{s.weeks} weeks <span className="text-text-secondary font-normal">(by {s.dateStr})</span>
                </div>
              </div>

              <div className="flex-grow flex flex-col gap-3 mb-5">
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green shrink-0 mt-0.5" />
                  <span className="text-[12px] text-text-primary leading-snug">{s.pros}</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-coral shrink-0 mt-0.5" />
                  <span className="text-[12px] text-text-primary leading-snug">{s.cons}</span>
                </div>
              </div>

              <div className="bg-background-secondary p-3 text-[11px] text-text-secondary leading-snug mb-4 border border-border-tertiary rounded-sm">
                <span className="font-medium text-text-primary block mb-1">Protein Note</span>
                {s.proteinNote}
              </div>

              <button 
                onClick={() => handleChooseStrategy(s)}
                disabled={saveMutation.isPending}
                className={cn(
                  "w-full py-3 px-4 text-[13px] font-bold uppercase tracking-wider transition-opacity cursor-pointer text-center",
                  s.isRecommended 
                    ? "bg-purple text-background-primary border-none hover:opacity-90" 
                    : "bg-background-secondary text-text-primary border-[0.5px] border-border-secondary hover:border-border-tertiary"
                )}
              >
                {saveMutation.isPending ? 'Saving...' : 'Continue'}
              </button>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
