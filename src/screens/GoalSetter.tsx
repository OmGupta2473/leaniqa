import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { Target, Calendar, Flame } from 'lucide-react';

const currentBfOptions = [
  { bf: 15, label: 'Lean' },
  { bf: 18, label: 'Average' },
  { bf: 22, label: 'Moderate' },
  { bf: 25, label: 'High' },
  { bf: 30, label: 'High' }
];

const targetBfOptions = [
  { bf: 8, label: 'Athletic' },
  { bf: 10, label: 'Very lean' },
  { bf: 12, label: 'Lean' },
  { bf: 15, label: 'Fit' },
  { bf: 18, label: 'Average' }
];

const strategies = [
  { id: 'Aggressive', deficit: 600, label: 'Fastest' },
  { id: 'Recommended', deficit: 400, label: 'Balanced' },
  { id: 'Slow cut', deficit: 200, label: 'Sustainable' }
];

const Silhouette = ({ bf, active }: { bf: number; active: boolean }) => {
  const w = 16 + (bf - 8) * 1.4;
  return (
    <svg width="100%" height="40" viewBox="0 0 60 70" className={cn("mx-auto mb-2 transition-colors duration-300", active ? "text-purple" : "text-text-tertiary")}>
      <circle cx="30" cy="12" r="8" fill="currentColor" />
      <rect x={30 - w / 2} y="22" width={w} height="28" rx="6" fill="currentColor" />
      <rect x={30 - w / 2 + 2} y="52" width={w / 2 - 3} height="18" rx="4" fill="currentColor" />
      <rect x={30 + 1} y="52" width={w / 2 - 3} height="18" rx="4" fill="currentColor" />
    </svg>
  );
};

export function GoalSetterScreen() {
  const { setScreen } = useAppStore();
  const queryClient = useQueryClient();
  
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goalData } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });

  const [currentBf, setCurrentBf] = useState<number>(22);
  const [targetBf, setTargetBf] = useState<number>(12);
  const [strategy, setStrategy] = useState<string>('Recommended');

  useEffect(() => {
    if (goalData) {
      // Find closest current BF
      const closestCurrent = currentBfOptions.reduce((prev, curr) => 
        Math.abs(curr.bf - goalData.current_bf) < Math.abs(prev.bf - goalData.current_bf) ? curr : prev
      );
      setCurrentBf(closestCurrent.bf);

      // Default target based on gender
      if (profile?.gender === 'Female') {
        setTargetBf(18);
      } else {
        setTargetBf(12);
      }
    }
  }, [goalData, profile]);

  const saveGoalMutation = useMutation({
    mutationFn: async (goal: any) => {
      await profileService.upsertGoal(goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      setScreen('dash');
    }
  });

  const handleSave = () => {
    const selectedStrategy = strategies.find(s => s.id === strategy) || strategies[1];
    saveGoalMutation.mutate({
      current_bf: currentBf,
      target_bf: targetBf,
      strategy: selectedStrategy.id,
      deficit_kcal: selectedStrategy.deficit
    });
  };

  const weight = profile?.weight || 80;
  const selectedStrategy = strategies.find(s => s.id === strategy) || strategies[1];
  const deficit = selectedStrategy.deficit;
  
  let weeks = Math.round(((currentBf - targetBf) * weight * 0.0082) / ((deficit * 7) / 7700));
  if (weeks < 0) weeks = 0;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeks * 7);
  const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const kgToLose = Math.max(0, ((currentBf - targetBf) / 100) * weight).toFixed(1);

  let timelineColor = 'text-green';
  let timelineBorder = 'border-green/30';
  let timelineBg = 'bg-green/10';
  
  if (weeks >= 20 && weeks <= 35) {
    timelineColor = 'text-amber';
    timelineBorder = 'border-amber/30';
    timelineBg = 'bg-amber/10';
  } else if (weeks > 35) {
    timelineColor = 'text-coral';
    timelineBorder = 'border-coral/30';
    timelineBg = 'bg-coral/10';
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-6">
      <div className="mb-6 text-center">
        <h2 className="text-[20px] font-medium text-text-primary mb-1.5">Design Your Physics</h2>
        <p className="text-[13px] text-text-secondary">Set your starting point and destination.</p>
      </div>

      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-text-secondary mb-3 flex items-center justify-between">
          <span>Current Body Fat</span>
          <span className="text-purple">{currentBf}%</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {currentBfOptions.map((opt) => (
            <button
              key={opt.bf}
              onClick={() => setCurrentBf(opt.bf)}
              className={cn(
                "flex-1 min-w-[64px] p-2.5 rounded-lg border-[0.5px] cursor-pointer transition-all snap-center group bg-background-primary",
                currentBf === opt.bf 
                  ? "border-purple ring-1 ring-purple/50 bg-purple/5" 
                  : "border-border-secondary hover:border-text-tertiary"
              )}
            >
              <Silhouette bf={opt.bf} active={currentBf === opt.bf} />
              <div className={cn("text-[16px] font-medium text-center mb-0.5", currentBf === opt.bf ? "text-purple" : "text-text-primary")}>
                {opt.bf}%
              </div>
              <div className="text-[10px] text-text-secondary text-center uppercase tracking-wider">
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-text-secondary mb-3 flex items-center justify-between">
          <span>Target Body Fat</span>
          <span className="text-purple">{targetBf}%</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {targetBfOptions.map((opt) => (
            <button
              key={opt.bf}
              onClick={() => setTargetBf(opt.bf)}
              className={cn(
                "flex-1 min-w-[64px] p-2.5 rounded-lg border-[0.5px] cursor-pointer transition-all snap-center group bg-background-primary",
                targetBf === opt.bf 
                  ? "border-purple ring-1 ring-purple/50 bg-purple/5" 
                  : "border-border-secondary hover:border-text-tertiary"
              )}
            >
              <Silhouette bf={opt.bf} active={targetBf === opt.bf} />
              <div className={cn("text-[16px] font-medium text-center mb-0.5", targetBf === opt.bf ? "text-purple" : "text-text-primary")}>
                {opt.bf}%
              </div>
              <div className="text-[10px] text-text-secondary text-center uppercase tracking-wider">
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={cn("mb-6 p-4 rounded-xl border border-dashed transition-colors", timelineBorder, timelineBg)}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
            <Calendar size={14} className={timelineColor} /> 
            Timeline Projection
          </div>
          <div className={cn("text-[18px] font-medium", timelineColor)}>
            {weeks} weeks
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/10 dark:border-white/10">
          <div>
            <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Target Date</div>
            <div className="text-[14px] font-medium text-text-primary">{weeks === 0 ? 'Goal Reached' : dateStr}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">To Lose</div>
            <div className="text-[14px] font-medium text-text-primary">~{kgToLose} kg</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-text-secondary mb-3 flex items-center gap-1.5">
          <Flame size={14} /> Pacing Strategy
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => setStrategy(s.id)}
              className={cn(
                "flex-1 min-w-[100px] p-3 rounded-lg border-[0.5px] cursor-pointer transition-all flex flex-col justify-between bg-background-primary snap-center",
                strategy === s.id 
                  ? "border-purple ring-1 ring-purple/50 bg-purple/5" 
                  : "border-border-secondary hover:border-text-tertiary"
              )}
            >
              <div className="flex flex-col text-left mb-2">
                <span className={cn("text-[14px] font-medium", strategy === s.id ? "text-purple" : "text-text-primary")}>
                  {s.id === 'Aggressive' ? 'Aggressive cut' : s.id}
                </span>
                <span className="text-[11px] text-text-secondary mt-0.5">{s.label}</span>
              </div>
              <span className={cn("text-[13px] font-medium font-mono text-left", strategy === s.id ? "text-purple" : "text-text-secondary")}>
                -{s.deficit} <span className="text-[10px]">kcal/d</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={saveGoalMutation.isPending || currentBf <= targetBf} 
        className="w-full p-3 border-none bg-purple text-background-primary text-[14px] font-bold tracking-tight uppercase cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
      >
        {saveGoalMutation.isPending ? 'Saving...' : 'Lock in my goal →'}
      </button>
      
      {currentBf <= targetBf && (
        <p className="text-center text-[11px] text-coral mt-3">Target body fat must be lower than current body fat to set a deficit goal.</p>
      )}
    </div>
  );
}
