import { Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { mealService } from '../services/mealService';
import { weightService } from '../services/weightService';

export function WeeklyReportScreen() {
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: meals = [] } = useQuery({ queryKey: ['meals'], queryFn: () => mealService.getMeals() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });

  const maintKcal = profile?.maintenance_kcal || 2200;
  const targetKcal = maintKcal - 400;
  const proteinTarget = profile?.protein_target || 150;

  // Simple analytics logic for past 7 days
  const today = new Date();
  const past7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dayStats = past7Days.map(dateStr => {
    const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
    const kcals = dayMeals.reduce((acc, m) => acc + m.calories, 0);
    const prot = dayMeals.reduce((acc, m) => acc + m.protein, 0);
    const weightLog = weightLogs.find(w => w.date.startsWith(dateStr));
    
    // Score
    const kcalScore = kcals === 0 ? 0 : Math.max(0, 100 - Math.abs((kcals - targetKcal) / targetKcal) * 100);
    const protScore = prot === 0 ? 0 : Math.min(100, (prot / proteinTarget) * 100);
    // Water and weight omitted from strict score for simplicity unless requested
    const score = Math.round((kcalScore * 0.4) + (protScore * 0.3) + 30); // Base 30 for water/weight

    return {
      date: dateStr,
      day: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
      kcals,
      prot,
      score: kcals === 0 ? 0 : score, // 0 if no data
      weight: weightLog?.weight
    };
  });

  const avgScore = Math.round(dayStats.filter(d => d.score > 0).reduce((acc, d) => acc + d.score, 0) / (dayStats.filter(d => d.score > 0).length || 1));
  const avgProtPct = Math.round(dayStats.filter(d => d.prot > 0).reduce((acc, d) => acc + (d.prot / proteinTarget * 100), 0) / (dayStats.filter(d => d.prot > 0).length || 1));
  
  const startWeight = dayStats.find(d => d.weight)?.weight || profile?.weight || 80;
  const endWeight = dayStats.slice().reverse().find(d => d.weight)?.weight || startWeight;
  const weightChange = (endWeight - startWeight).toFixed(1);

  // Find Best and Worst Days
  const daysWithData = dayStats.filter(d => d.score > 0);
  const bestDay = daysWithData.length > 0 ? daysWithData.reduce((prev, current) => (prev.score > current.score) ? prev : current) : null;
  const worstDay = daysWithData.length > 0 ? daysWithData.reduce((prev, current) => (prev.score < current.score) ? prev : current) : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-0.5">Weekly Report</div>
          <div className="text-[14px] font-medium text-text-primary">Last 7 Days</div>
        </div>
        <div className="bg-purple/10 border-[0.5px] border-purple/20 text-purple rounded-full px-2.5 py-1 text-[12px] font-medium">
          Generated
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3.5">
        <div className="bg-background-secondary rounded-md p-2.5 text-center border border-border-tertiary">
          <div className="text-[18px] font-medium text-teal">{weightChange}kg</div>
          <div className="text-[10px] text-text-secondary mt-0.5">WEIGHT CHANGE</div>
        </div>
        <div className="bg-background-secondary rounded-md p-2.5 text-center border border-border-tertiary">
          <div className="text-[18px] font-medium text-blue">{avgProtPct}%</div>
          <div className="text-[10px] text-text-secondary mt-0.5">PROT. COMPLIANCE</div>
        </div>
        <div className="bg-background-secondary rounded-md p-2.5 text-center border border-border-tertiary">
          <div className="text-[18px] font-medium text-amber">{avgScore || 0}</div>
          <div className="text-[10px] text-text-secondary mt-0.5">AVG SCORE</div>
        </div>
      </div>

      <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-2">Daily Compliance</div>
      <div className="mb-3.5">
        {dayStats.map(d => (
          <div key={d.date} className="flex items-center gap-2 mb-1.5">
            <div className="text-[11px] text-text-secondary w-7 shrink-0">{d.day}</div>
            <div className="flex-1 h-2.5 bg-background-secondary rounded-full overflow-hidden border-[0.5px] border-border-tertiary">
              <div className="h-2.5 rounded-full transition-all duration-300 bg-purple" style={{ width: `${d.score}%` }}></div>
            </div>
            <div className="text-[11px] font-medium w-7 text-right text-text-primary">{d.score}</div>
          </div>
        ))}
      </div>

      <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-2">AI Insights</div>
      <div className="flex flex-col gap-2">
        {bestDay && (
          <div className="p-2.5 px-3 border border-border-tertiary rounded-md border-l-[3px] border-l-teal bg-background-secondary">
            <div className="text-[12px] font-medium text-text-primary mb-1 flex items-center gap-1"><TrendingUp size={13} className="text-teal" /> Best Day: {bestDay.day}</div>
            <div className="text-[12px] text-text-secondary">You hit a score of {bestDay.score}. Try to repeat whatever you ate on {bestDay.day}.</div>
          </div>
        )}
        {worstDay && worstDay.score < 70 && (
          <div className="p-2.5 px-3 border border-border-tertiary rounded-md border-l-[3px] border-l-coral bg-background-secondary">
            <div className="text-[12px] font-medium text-text-primary mb-1 flex items-center gap-1"><AlertTriangle size={13} className="text-coral" /> Room for Improvement: {worstDay.day}</div>
            <div className="text-[12px] text-text-secondary">Your score dipped to {worstDay.score}. This was primarily driven by missed targets. Prep meals in advance to avoid this.</div>
          </div>
        )}
        <div className="p-2.5 px-3 border border-border-tertiary rounded-md border-l-[3px] border-l-blue bg-background-secondary">
          <div className="text-[12px] font-medium text-text-primary mb-1 flex items-center gap-1"><Calendar size={13} className="text-blue" /> Next Week's Action</div>
          <div className="text-[12px] text-text-secondary">Focus strictly on hitting {proteinTarget}g of protein daily. Consistency here will improve recovery and metabolic rate.</div>
        </div>
      </div>
    </div>
  );
}
