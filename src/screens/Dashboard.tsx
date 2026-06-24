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

export function DashboardScreen() {
  const { setScreen } = useAppStore();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals } = useQuery({ queryKey: ['meals'], queryFn: () => mealService.getMeals() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });
  const { data: waterLogs = [] } = useQuery({ queryKey: ['waterLogs'], queryFn: () => waterService.getWaterLogs() });
  
  const { data: scores } = useQuery({ 
    queryKey: ['scores'], 
    queryFn: () => complianceService.getScores() 
  });

  const updateScoreMutation = useMutation({
    mutationFn: () => complianceService.updateTodayScore(0), // water is now handled in the query or backend
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scores'] })
  });

  const addWaterMutation = useMutation({
    mutationFn: (amountMl: number) => waterService.addWater(amountMl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterLogs'] });
      updateScoreMutation.mutate();
    }
  });

  const mealsLength = meals?.length || 0;
  const weightLogsLength = weightLogs?.length || 0;

  useEffect(() => {
    // Update daily score whenever meals or weight logs change
    updateScoreMutation.mutate();
  }, [mealsLength, weightLogsLength]);

  const name = profile?.name || 'User';
  const currentBf = goal?.current_bf ?? 20; // fallback if body fat not tracked
  const targetBf = goal?.target_bf || 12;
  const maintKcal = profile?.maintenance_kcal || 2200;
  const proteinTarget = profile?.protein_target || 150;
  
  const dailyTargetKcal = maintKcal - 400; // Simplified for deficit
  const waterTargetLiters = 3.0; // Fixed generic target for now
  
  // Calculate today's intake
  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals?.filter(m => m.meal_time.startsWith(today)) || [];
  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);
  
  const todaysWater = waterLogs.filter(w => w.date.startsWith(today)).reduce((acc, w) => acc + w.amount_ml, 0);
  const todaysWaterLiters = todaysWater / 1000;
  
  const remainingKcal = Math.max(0, dailyTargetKcal - eatenKcal);
  const remainingProtein = Math.max(0, proteinTarget - eatenProtein);

  // Projected Date Calculation using Engine
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile?.weight || 80;
  const weeklyDeficitKcal = 400 * 7;
  const complianceScore = scores?.weeklyAverage || 80; // Use actual weekly average for projection!
  
  const projections = calculateProjections({
    currentWeight,
    currentBf,
    targetBf,
    weeklyDeficitKcal,
    complianceScore: Math.max(complianceScore, 10), // minimum 10% to avoid infinity
  });
  
  const targetProjection = projections.find(p => p.bfTarget === targetBf);
  
  let projectedDateString = 'Unknown';
  if (targetProjection) {
    if (targetProjection.status === 'completed') {
      projectedDateString = 'Completed!';
    } else {
      projectedDateString = targetProjection.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  // Recommendations
  let recommendation = '';
  if (remainingProtein > 40) {
    recommendation = `${Math.round(remainingProtein / 0.31)}g chicken breast or ${Math.round(remainingProtein / 0.25)}g paneer`;
  } else if (remainingProtein > 20) {
    recommendation = `1 scoop of whey protein or ${Math.round(remainingProtein / 0.06)}g eggs`;
  } else if (remainingProtein > 0) {
    recommendation = `A small high-protein snack, like greek yogurt`;
  } else {
    recommendation = `Targets hit! Keep calories under ${remainingKcal} if you want a snack.`;
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
          <div className="text-[24px] font-medium text-purple leading-none">{scores?.todayScore || 0}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Today's Score</div>
        </div>
      </div>

      {/* Card 1: Goal */}
      <div className="bg-gradient-to-br from-purple/20 via-purple/5 to-background-secondary p-5 mb-4 border border-purple/30 rounded-lg shadow-[0_4px_20px_rgba(167,139,250,0.1)] relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple/10 rounded-full blur-2xl"></div>
        <div className="flex justify-between text-[11px] text-text-secondary uppercase tracking-widest mb-3 font-medium relative z-10">
          <span className="text-purple flex items-center gap-1.5"><Target size={12} /> {targetBf}% Target</span>
          <span className="text-purple bg-purple/10 px-2 py-0.5 rounded-sm">Projected: {projectedDateString}</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2 relative z-10">
          <span className="text-[36px] font-bold text-text-primary tracking-tight leading-none">{currentBf.toFixed(1)}%</span>
          <span className="text-[12px] text-text-secondary font-medium">Current Body Fat</span>
        </div>
        <div className="h-2 bg-background-primary/50 overflow-hidden mt-4 border border-purple/10 rounded-full relative z-10">
          <div className="h-full bg-purple rounded-full shadow-[0_0_10px_rgba(167,139,250,0.5)]" style={{ width: `${Math.min(100, Math.max(5, (100 - (currentBf - targetBf) * 5)))}%` }}></div>
        </div>
      </div>

      {/* Card 2: Today's Targets */}
      <div className="mb-3">
        <div className="text-[11px] text-text-secondary uppercase tracking-widest mb-1.5 font-medium px-1">Today's Targets</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background-secondary p-3 border border-border-tertiary text-center flex flex-col justify-between">
            <div className="text-[18px] font-medium text-amber">{eatenKcal} <span className="text-[10px] text-text-secondary font-normal">/ {dailyTargetKcal}</span></div>
            <div className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Calories</div>
          </div>
          <div className="bg-background-secondary p-3 border border-border-tertiary text-center flex flex-col justify-between">
            <div className="text-[18px] font-medium text-blue">{eatenProtein}g <span className="text-[10px] text-text-secondary font-normal">/ {proteinTarget}g</span></div>
            <div className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Protein</div>
          </div>
          <div className="bg-background-secondary p-2 border border-border-tertiary text-center flex flex-col justify-between">
            <div className="text-[18px] font-medium text-teal">{todaysWaterLiters.toFixed(1)}L <span className="text-[10px] text-text-secondary font-normal">/ {waterTargetLiters}L</span></div>
            <div className="flex justify-center gap-1 mt-2">
              <button onClick={() => addWaterMutation.mutate(250)} className="bg-background-primary border border-border-tertiary rounded px-1.5 py-0.5 text-[9px] hover:bg-border-secondary transition-colors">+250</button>
              <button onClick={() => addWaterMutation.mutate(500)} className="bg-background-primary border border-border-tertiary rounded px-1.5 py-0.5 text-[9px] hover:bg-border-secondary transition-colors">+500</button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: What To Do Next */}
      <div className="bg-purple/5 p-4 mb-4 border border-purple/20">
        <div className="flex items-center gap-1.5 text-[11px] text-purple uppercase tracking-widest mb-2 font-medium">
          <AlertCircle size={14} /> What to do next
        </div>
        <div className="text-[14px] text-text-primary mb-1">
          You need <strong className="font-medium text-purple">{remainingProtein}g</strong> more protein today.
        </div>
        <div className="text-[13px] text-text-secondary">
          Recommendation: <span className="font-medium text-text-primary">{recommendation}</span>
        </div>
      </div>

      <button onClick={() => setScreen('meal')} className="w-full p-3 border-none bg-purple text-background-primary text-[14px] font-bold uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-90 shadow-lg shadow-purple/20">Log Meal</button>
    </div>
  );
}
