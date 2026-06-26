import { useAppStore } from '../store';
import { Target, Footprints, Utensils, CheckCircle2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { mealService } from '../services/mealService';
import { weightService } from '../services/weightService';
import { complianceService } from '../services/complianceService';
import { calculateProjections } from '../lib/projectionEngine';
import { useEffect, useState } from 'react';
import { QueryError } from '../components/QueryError';

export function DashboardScreen() {
  const { setScreen, onboardingData } = useAppStore();
  const queryClient = useQueryClient();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: profile, isError: isProfileError, error: profileError, refetch: refetchProfile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal, isError: isGoalError, error: goalError, refetch: refetchGoal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals, isError: isMealsError, refetch: refetchMeals } = useQuery({ queryKey: ['meals', 'today'], queryFn: () => mealService.getTodaysMeals() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });
  const { data: scores } = useQuery({ queryKey: ['complianceScore'], queryFn: () => complianceService.getScores() });

  if (isProfileError || isGoalError) {
    return (
      <div className="flex flex-col h-full justify-center">
        <QueryError 
          error={profileError || goalError} 
          onRetry={() => {
            if (isProfileError) refetchProfile();
            if (isGoalError) refetchGoal();
          }} 
        />
      </div>
    );
  }

  const name = profile?.name ?? onboardingData?.name ?? 'User';
  const targetBf = goal?.target_bf ?? onboardingData?.targetBodyFatPct;
  const currentBf = goal?.current_bf ?? onboardingData?.currentBodyFatPct;
  const proteinTarget = profile?.protein_target ?? onboardingData?.proteinMid;
  const strategyName = goal?.strategy ?? onboardingData?.chosenStrategyName ?? 'Recommended';
  
  const dailyTargetKcal = profile?.maintenance_kcal && goal?.deficit_kcal 
    ? profile.maintenance_kcal - goal.deficit_kcal 
    : onboardingData?.dailyCalorieGoal;

  // Calculate today's intake
  const todaysMeals = meals || [];
  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);
  
  const remainingKcal = dailyTargetKcal !== undefined ? Math.max(0, dailyTargetKcal - eatenKcal) : undefined;
  const remainingProtein = proteinTarget !== undefined ? Math.max(0, proteinTarget - eatenProtein) : undefined;

  const { goalSetCompleted } = useAppStore();

  let projectedDateString = 'Unknown';
  if (goal?.deficit_kcal === 0 || onboardingData?.dailyDeficit === 0) {
    projectedDateString = 'Ongoing';
  } else if (goal?.target_date) {
    const targetDateObj = new Date(goal.target_date);
    if (!isNaN(targetDateObj.getTime())) {
       projectedDateString = targetDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  } else if (onboardingData?.estimatedCompletionDate) {
    projectedDateString = onboardingData.estimatedCompletionDate;
  }

  // Calculate Days
  let currentDay = 0;
  let totalDays = 0;
  let isMaintenance = goal?.deficit_kcal === 0 || onboardingData?.dailyDeficit === 0;
  
  if (goal?.created_at) {
    const start = new Date(goal.created_at);
    start.setHours(0,0,0,0);
    const now = new Date();
    now.setHours(0,0,0,0);
    currentDay = Math.max(0, Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (goal?.target_date && !isMaintenance) {
      const end = new Date(goal.target_date);
      end.setHours(0,0,0,0);
      totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      if (currentDay > totalDays) currentDay = totalDays;
    }
  } else if (onboardingData?.estimatedWeeks && !isMaintenance) {
    totalDays = onboardingData.estimatedWeeks * 7;
    currentDay = 0; // Just started
  }

  const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
  const todayScore = scores?.todayScore ?? 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-2">
      {!bannerDismissed && (
        <div className="bg-purple/10 border-[0.5px] border-purple/30 text-purple px-4 py-2 text-[11px] font-medium mb-3 rounded-md flex justify-between items-center">
          <span>Founding Member Beta - Premium features unlocked.</span>
          <button onClick={() => setBannerDismissed(true)} className="text-purple hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}
      
      {!goalSetCompleted && (
        <div className="bg-amber/10 border border-amber/30 text-amber p-4 text-center mb-3 rounded-md flex flex-col items-center gap-2">
          <div className="text-[13px] font-medium">Set your physique goal to unlock all features</div>
          <button 
            onClick={() => setScreen('goal')} 
            className="text-[11px] font-bold uppercase tracking-widest bg-amber text-background-primary px-3 py-1.5 rounded-sm shadow-sm"
          >
            Set goal →
          </button>
        </div>
      )}

      {/* SECTION 2 — Hero greeting row */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-[16px] font-medium text-text-primary">Hi, {name}</div>
          <div className="text-[13px] text-text-secondary mt-0.5">{dateString}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-full border-2 border-purple flex items-center justify-center text-purple text-[14px] font-bold">
            {todayScore}
          </div>
          <div className="text-[10px] text-text-secondary mt-1 uppercase tracking-widest">Score</div>
        </div>
      </div>

      {/* SECTION 3 — Body fat hero card */}
      <div className="bg-gradient-to-br from-purple/20 via-purple/5 to-background-secondary p-4 mb-3 border border-purple/30 rounded-lg shadow-[0_4px_20px_rgba(167,139,250,0.1)] relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple/10 rounded-full blur-2xl"></div>
        <div className="flex justify-between text-[11px] text-text-secondary uppercase tracking-widest mb-3 font-medium relative z-10">
          <span className="text-purple flex items-center gap-1.5"><Target size={12} /> {targetBf !== undefined ? targetBf : '—'}% Target</span>
          <span className="text-purple bg-purple/10 px-2 py-0.5 rounded-sm">Projected: {projectedDateString}</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2 relative z-10">
          <span className="text-[32px] font-bold text-text-primary tracking-tight leading-none">{currentBf !== undefined ? currentBf.toFixed(1) : '—'}%</span>
          <span className="text-[12px] text-text-secondary font-medium">Current Body Fat</span>
        </div>
        <div className="h-2 bg-background-primary/50 overflow-hidden mt-4 border border-purple/10 rounded-full relative z-10">
          <div className="h-full bg-purple rounded-full shadow-[0_0_10px_rgba(167,139,250,0.5)]" style={{ width: `${currentBf !== undefined && targetBf !== undefined ? Math.min(100, Math.max(5, (100 - (currentBf - targetBf) * 5))) : 0}%` }}></div>
        </div>
        <div className="text-[11px] text-text-secondary mt-2 text-center relative z-10">
          {isMaintenance ? 'Maintenance Progress' : `Day ${currentDay} of ${totalDays} · ${totalDays > 0 ? Math.round((currentDay/totalDays)*100) : 0}% complete`}
        </div>
      </div>

      {/* Card 2: Today's Targets */}
      <div className="mb-3">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-widest font-medium">
            Today's Targets <span className="text-purple ml-1">({strategyName})</span>
          </div>
        </div>
        
        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Calories */}
          <div className="bg-background-secondary p-4 border border-border-tertiary rounded-md text-center flex flex-col justify-center relative overflow-hidden">
            {isMealsError ? (
              <div className="text-[10px] text-red-500 my-auto cursor-pointer" onClick={() => refetchMeals()}>Retry</div>
            ) : (
              <>
                <div className="text-[22px] font-medium text-amber leading-none">{eatenKcal}</div>
                <div className="text-[11px] text-text-secondary mt-1">/ {dailyTargetKcal !== undefined ? dailyTargetKcal : '—'} kcal</div>
                <div className="text-[10px] text-text-secondary mt-2 uppercase tracking-wider font-medium">Calories</div>
                <div className="absolute bottom-0 left-0 h-1 bg-amber/20 w-full">
                  <div className="h-full bg-amber" style={{ width: `${dailyTargetKcal ? Math.min(100, (eatenKcal/dailyTargetKcal)*100) : 0}%` }}></div>
                </div>
              </>
            )}
          </div>
          
          {/* Protein */}
          <div className="bg-background-secondary p-4 border border-border-tertiary rounded-md text-center flex flex-col justify-center relative overflow-hidden">
            {isMealsError ? (
              <div className="text-[10px] text-red-500 my-auto cursor-pointer" onClick={() => refetchMeals()}>Retry</div>
            ) : (
              <>
                <div className="text-[22px] font-medium text-blue leading-none">{eatenProtein}g</div>
                <div className="text-[11px] text-text-secondary mt-1">/ {proteinTarget !== undefined ? proteinTarget : '—'}g</div>
                <div className="text-[10px] text-text-secondary mt-2 uppercase tracking-wider font-medium">Protein</div>
                <div className="absolute bottom-0 left-0 h-1 bg-blue/20 w-full">
                  <div className="h-full bg-blue" style={{ width: `${proteinTarget ? Math.min(100, (eatenProtein/proteinTarget)*100) : 0}%` }}></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Steps Reminder */}
        <div className="bg-background-secondary border border-border-tertiary p-3 rounded-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Footprints size={16} className="text-amber" />
            <div className="text-[14px] font-medium text-text-primary">12,000 steps</div>
            <div className="text-[8px] bg-amber/10 text-amber px-1.5 py-0.5 rounded-sm uppercase tracking-widest">Reminder only</div>
          </div>
          <div className="text-[11px] text-text-secondary italic">Move more, recover better.</div>
        </div>
      </div>

      {/* Card 3: Today's meal ideas */}
      <div className="bg-purple/5 p-4 mb-3 border border-purple/20 rounded-lg">
        <div className="flex items-center gap-1.5 text-[11px] text-purple uppercase tracking-widest mb-2 font-medium">
          <Utensils size={14} /> Meal ideas to hit your protein
        </div>
        {remainingProtein !== undefined && remainingProtein <= 0 ? (
          <div className="text-[14px] text-green flex items-center gap-2 mt-3 font-medium">
            <CheckCircle2 size={16} /> Protein target hit! Great work today.
          </div>
        ) : (
          <>
            <div className="text-[13px] text-text-secondary mb-4">
              ~{remainingProtein !== undefined ? remainingProtein : 0}g protein remaining
            </div>
            <div className="space-y-3">
              {/* Option A */}
              <div className="bg-background-primary border border-border-secondary rounded-md p-3 flex flex-col gap-2">
                <div className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Option A</div>
                <div className="text-[13px] text-text-primary font-medium">
                  {remainingProtein !== undefined && remainingProtein > 30 
                    ? "4 whole eggs + 1 cup milk" 
                    : remainingProtein !== undefined && remainingProtein > 15
                    ? "2 boiled eggs + 100g Greek yogurt"
                    : "1 boiled egg"}
                </div>
                <div className="flex gap-2">
                  <span className="bg-blue/10 text-blue text-[10px] px-2 py-0.5 rounded-sm font-medium">
                    {remainingProtein !== undefined && remainingProtein > 30 
                    ? "~28g protein" 
                    : remainingProtein !== undefined && remainingProtein > 15
                    ? "~20g protein"
                    : "~6g protein"}
                  </span>
                  <span className="bg-amber/10 text-amber text-[10px] px-2 py-0.5 rounded-sm font-medium">
                    {remainingProtein !== undefined && remainingProtein > 30 
                    ? "~350 kcal" 
                    : remainingProtein !== undefined && remainingProtein > 15
                    ? "~200 kcal"
                    : "~70 kcal"}
                  </span>
                </div>
              </div>

              {/* Option B */}
              <div className="bg-background-primary border border-border-secondary rounded-md p-3 flex flex-col gap-2">
                <div className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Option B</div>
                <div className="text-[13px] text-text-primary font-medium">
                  {remainingProtein !== undefined && remainingProtein > 40 
                    ? "250g chicken breast (grilled)" 
                    : remainingProtein !== undefined && remainingProtein > 20
                    ? "150g chicken breast"
                    : "100g chicken breast"}
                </div>
                <div className="flex gap-2">
                  <span className="bg-blue/10 text-blue text-[10px] px-2 py-0.5 rounded-sm font-medium">
                    {remainingProtein !== undefined && remainingProtein > 40 
                    ? "~55g protein" 
                    : remainingProtein !== undefined && remainingProtein > 20
                    ? "~33g protein"
                    : "~22g protein"}
                  </span>
                  <span className="bg-amber/10 text-amber text-[10px] px-2 py-0.5 rounded-sm font-medium">
                    {remainingProtein !== undefined && remainingProtein > 40 
                    ? "~280 kcal" 
                    : remainingProtein !== undefined && remainingProtein > 20
                    ? "~165 kcal"
                    : "~110 kcal"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-tertiary"></div></div>
                <div className="relative bg-purple/5 px-2 text-[10px] text-text-tertiary font-medium uppercase tracking-widest">OR</div>
              </div>

              {/* Option C */}
              <div className="bg-background-primary border border-border-secondary rounded-md p-3 flex flex-col gap-2">
                <div className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Option C</div>
                <div className="text-[13px] text-text-primary font-medium">
                  {remainingProtein !== undefined && remainingProtein > 40 
                    ? "300g low-fat paneer OR 150g soya chunks" 
                    : remainingProtein !== undefined && remainingProtein > 20
                    ? "200g low-fat paneer OR 100g soya chunks"
                    : "100g paneer OR 50g soya chunks"}
                </div>
                <div className="flex gap-2">
                  <span className="bg-blue/10 text-blue text-[10px] px-2 py-0.5 rounded-sm font-medium">
                    {remainingProtein !== undefined && remainingProtein > 40 
                    ? "~54g or ~52g protein" 
                    : remainingProtein !== undefined && remainingProtein > 20
                    ? "~36g protein"
                    : "~18g protein"}
                  </span>
                  <span className="bg-amber/10 text-amber text-[10px] px-2 py-0.5 rounded-sm font-medium">
                    {remainingProtein !== undefined && remainingProtein > 40 
                    ? "~400 kcal" 
                    : remainingProtein !== undefined && remainingProtein > 20
                    ? "~250 kcal"
                    : "~130 kcal"}
                  </span>
                </div>
              </div>

            </div>
          </>
        )}
      </div>

      <button onClick={() => setScreen('meal')} className="w-full p-3 border-none bg-purple text-background-primary text-[14px] font-bold uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-90 shadow-lg shadow-purple/20 mb-3">Log Meal</button>
    </div>
  );
}
