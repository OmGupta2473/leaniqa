import { useAppStore } from '../store';
import { Target, Droplets, Utensils, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { mealService } from '../services/mealService';
import { weightService } from '../services/weightService';
import { complianceService } from '../services/complianceService';
import { waterService } from '../services/waterService';
import { calculateProjections } from '../lib/projectionEngine';
import { useEffect } from 'react';
import { QueryError } from '../components/QueryError';

export function DashboardScreen() {
  const { setScreen, onboardingData } = useAppStore();
  const queryClient = useQueryClient();

  const { data: profile, isError: isProfileError, error: profileError, refetch: refetchProfile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal, isError: isGoalError, error: goalError, refetch: refetchGoal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals, isError: isMealsError, refetch: refetchMeals } = useQuery({ queryKey: ['meals', 'today'], queryFn: () => mealService.getTodaysMeals() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });
  const { data: todaysWaterTotal = 0, isError: isWaterError, refetch: refetchWater } = useQuery({ queryKey: ['waterTotal', 'today'], queryFn: () => waterService.getTodaysWaterTotal() });
  
  const { data: scores } = useQuery({ 
    queryKey: ['scores'], 
    queryFn: () => complianceService.getScores(),
    staleTime: 5 * 60 * 1000
  });

  const addWaterMutation = useMutation({
    mutationFn: (amountMl: number) => waterService.addWater(amountMl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterTotal', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['scores'] });
    }
  });

  const handleRefreshScore = async () => {
    await complianceService.updateTodayScore(0);
    queryClient.invalidateQueries({ queryKey: ['scores'] });
  };

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

  const name = onboardingData?.name || profile?.name || 'User';
  const targetBf = onboardingData?.targetBodyFatPct ?? goal?.target_bf;
  const currentBf = onboardingData?.currentBodyFatPct ?? goal?.current_bf;
  const proteinTarget = onboardingData?.proteinMid ?? profile?.protein_target;
  const strategyName = onboardingData?.chosenStrategyName ?? goal?.strategy ?? 'Recommended';
  
  const dailyTargetKcal = onboardingData?.dailyCalorieGoal ?? (profile?.maintenance_kcal ? profile.maintenance_kcal - (goal?.deficit_kcal ?? 400) : undefined);
  const waterTargetLiters = onboardingData?.waterLitres ? parseFloat(onboardingData.waterLitres) : undefined;
  
  // Calculate today's intake
  const todaysMeals = meals || [];
  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);
  
  const todaysWaterLiters = todaysWaterTotal / 1000;
  
  const remainingKcal = dailyTargetKcal !== undefined ? Math.max(0, dailyTargetKcal - eatenKcal) : undefined;
  const remainingProtein = proteinTarget !== undefined ? Math.max(0, proteinTarget - eatenProtein) : undefined;

  let projectedDateString = onboardingData?.estimatedCompletionDate || goal?.target_date || 'Unknown';

  // Recommendations
  let recommendation = '';
  if (remainingProtein !== undefined) {
    if (remainingProtein > 40) {
      recommendation = `${Math.round(remainingProtein / 0.31)}g chicken breast or ${Math.round(remainingProtein / 0.25)}g paneer`;
    } else if (remainingProtein > 20) {
      recommendation = `1 scoop of whey protein or ${Math.round(remainingProtein / 0.06)}g eggs`;
    } else if (remainingProtein > 0) {
      recommendation = `A small high-protein snack, like greek yogurt`;
    } else {
      recommendation = `Targets hit! Keep calories under ${remainingKcal ?? 'your target'} if you want a snack.`;
    }
  } else {
    recommendation = '—';
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-purple/10 border-[0.5px] border-purple/30 text-purple px-4 py-2 text-center text-[11px] font-medium mb-4 rounded-md">
        Founding Member Beta - Premium features unlocked.
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-[12px] text-text-secondary">Welcome back,</div>
          <div className="text-[18px] font-medium text-text-primary">{name}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefreshScore} 
              className="text-[10px] bg-purple/10 text-purple border border-purple/30 px-2 py-1 rounded hover:bg-purple/20 transition-colors"
            >
              Refresh score
            </button>
            <div className="text-[24px] font-medium text-purple leading-none">{scores?.todayScore || 0}</div>
          </div>
          <div className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Today's Score</div>
        </div>
      </div>

      {/* Card 1: Goal */}
      <div className="bg-gradient-to-br from-purple/20 via-purple/5 to-background-secondary p-5 mb-4 border border-purple/30 rounded-lg shadow-[0_4px_20px_rgba(167,139,250,0.1)] relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple/10 rounded-full blur-2xl"></div>
        <div className="flex justify-between text-[11px] text-text-secondary uppercase tracking-widest mb-3 font-medium relative z-10">
          <span className="text-purple flex items-center gap-1.5"><Target size={12} /> {targetBf !== undefined ? targetBf : '—'}% Target</span>
          <span className="text-purple bg-purple/10 px-2 py-0.5 rounded-sm">Projected: {projectedDateString}</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2 relative z-10">
          <span className="text-[36px] font-bold text-text-primary tracking-tight leading-none">{currentBf !== undefined ? currentBf.toFixed(1) : '—'}%</span>
          <span className="text-[12px] text-text-secondary font-medium">Current Body Fat</span>
        </div>
        <div className="h-2 bg-background-primary/50 overflow-hidden mt-4 border border-purple/10 rounded-full relative z-10">
          <div className="h-full bg-purple rounded-full shadow-[0_0_10px_rgba(167,139,250,0.5)]" style={{ width: `${currentBf !== undefined && targetBf !== undefined ? Math.min(100, Math.max(5, (100 - (currentBf - targetBf) * 5))) : 0}%` }}></div>
        </div>
      </div>

      {/* Card 2: Today's Targets */}
      <div className="mb-3">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div className="text-[11px] text-text-secondary uppercase tracking-widest font-medium">
            Today's Targets <span className="text-purple ml-1">({strategyName})</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background-secondary p-3 border border-border-tertiary text-center flex flex-col justify-between">
            {isMealsError ? (
              <div className="text-[10px] text-red-500 my-auto cursor-pointer" onClick={() => refetchMeals()}>Retry</div>
            ) : (
              <>
                <div className="text-[18px] font-medium text-amber">{eatenKcal} <span className="text-[10px] text-text-secondary font-normal">/ {dailyTargetKcal !== undefined ? dailyTargetKcal : '—'}</span></div>
                <div className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Calories</div>
              </>
            )}
          </div>
          <div className="bg-background-secondary p-3 border border-border-tertiary text-center flex flex-col justify-between">
            {isMealsError ? (
              <div className="text-[10px] text-red-500 my-auto cursor-pointer" onClick={() => refetchMeals()}>Retry</div>
            ) : (
              <>
                <div className="text-[18px] font-medium text-blue">{eatenProtein}g <span className="text-[10px] text-text-secondary font-normal">/ {proteinTarget !== undefined ? proteinTarget : '—'}g</span></div>
                <div className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Protein</div>
              </>
            )}
          </div>
          <div className="bg-background-secondary p-2 border border-border-tertiary text-center flex flex-col justify-between">
            {isWaterError ? (
              <div className="text-[10px] text-red-500 my-auto cursor-pointer" onClick={() => refetchWater()}>Retry</div>
            ) : (
              <>
                <div className="text-[18px] font-medium text-teal">{todaysWaterLiters.toFixed(1)}L <span className="text-[10px] text-text-secondary font-normal">/ {waterTargetLiters !== undefined ? waterTargetLiters : '—'}L</span></div>
                <div className="flex justify-center gap-1 mt-2">
                  <button onClick={() => addWaterMutation.mutate(250)} className="bg-background-primary border border-border-tertiary rounded px-1.5 py-0.5 text-[9px] hover:bg-border-secondary transition-colors">+250</button>
                  <button onClick={() => addWaterMutation.mutate(500)} className="bg-background-primary border border-border-tertiary rounded px-1.5 py-0.5 text-[9px] hover:bg-border-secondary transition-colors">+500</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card 3: What To Do Next */}
      <div className="bg-purple/5 p-4 mb-4 border border-purple/20">
        <div className="flex items-center gap-1.5 text-[11px] text-purple uppercase tracking-widest mb-2 font-medium">
          <AlertCircle size={14} /> What to do next
        </div>
        <div className="text-[14px] text-text-primary mb-1">
          {remainingProtein !== undefined ? (
            <>You need <strong className="font-medium text-purple">{remainingProtein}g</strong> more protein today.</>
          ) : (
            <>Your daily targets are not fully set yet.</>
          )}
        </div>
        <div className="text-[13px] text-text-secondary">
          Recommendation: <span className="font-medium text-text-primary">{recommendation}</span>
        </div>
      </div>

      <button onClick={() => setScreen('meal')} className="w-full p-3 border-none bg-purple text-background-primary text-[14px] font-bold uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-90 shadow-lg shadow-purple/20">Log Meal</button>
    </div>
  );
}
