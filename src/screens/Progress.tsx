import { useState } from 'react';
import { Target, Scale } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { weightService } from '../services/weightService';
import { calculateProjections } from '../lib/projectionEngine';

export function ProgressScreen() {
  const [weight, setWeight] = useState('');
  
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile?.weight || 80;
  
  const addWeightMutation = useMutation({
    mutationFn: async (val: number) => {
      return weightService.addWeightLog({
        weight: val,
        date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
      setWeight('');
    }
  });

  const handleLog = () => {
    const val = parseFloat(weight);
    if (!val) return;
    addWeightMutation.mutate(val);
  };

  const chartData = weightLogs.map((log, i) => ({
    name: `Day ${i + 1}`,
    weight: log.weight
  }));

  if (chartData.length === 0) {
    chartData.push({ name: 'Start', weight: currentWeight });
  }

  const currentBf = goal?.current_bf || 20;
  const targetBf = goal?.target_bf || 12;
  const weeklyDeficitKcal = 400 * 7; // Average weekly deficit
  const complianceScore = 80; // Estimated 80% compliance

  const projections = calculateProjections({
    currentWeight,
    currentBf,
    targetBf,
    weeklyDeficitKcal,
    complianceScore,
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-4">
        <h2 className="text-[18px] font-medium text-text-primary mb-1">Morning Weight</h2>
        <p className="text-[12px] text-text-secondary">Log your weight daily to track your physique timeline.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <input 
          type="number" 
          value={weight} 
          onChange={(e) => setWeight(e.target.value)} 
          placeholder={`e.g. ${currentWeight}`} 
          className="flex-1 px-3 py-2 border-[0.5px] border-border-secondary bg-background-primary text-text-primary focus:outline-none focus:border-purple"
          disabled={addWeightMutation.isPending}
        />
        <button onClick={handleLog} disabled={addWeightMutation.isPending} className="px-4 py-2 border-none bg-purple text-background-primary font-bold uppercase tracking-widest text-[12px] cursor-pointer disabled:opacity-50">Log</button>
      </div>

      <div className="bg-background-secondary p-4 border border-border-tertiary mb-4">
        <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary mb-3">Weight Trend</div>
        {weightLogs.length > 0 ? (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-purple)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Area type="monotone" dataKey="weight" stroke="var(--color-purple)" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[150px] flex items-center justify-center text-[12px] text-text-secondary border-[0.5px] border-dashed border-border-secondary">
            Log your weight to see trends.
          </div>
        )}
      </div>

      <div className="bg-background-secondary p-4 border border-border-tertiary">
        <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary mb-3">Physique Transformation Roadmap</div>
        
        <div className="relative pl-6 space-y-6 py-2">
          {/* Vertical timeline line */}
          <div className="absolute top-0 bottom-0 left-2.5 w-[2px] bg-border-secondary"></div>
          
          {projections.map((p, index) => {
            const isCompleted = p.status === 'completed';
            const isCurrent = !isCompleted && (index === 0 || projections[index - 1].status === 'completed');
            
            return (
              <div key={p.bfTarget} className="relative">
                {/* Timeline Dot */}
                <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 bg-background-primary z-10 ${isCompleted ? 'border-text-secondary bg-text-secondary' : isCurrent ? 'border-purple shadow-[0_0_8px_rgba(167,139,250,0.6)]' : 'border-border-secondary'}`}></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <div className={`text-[15px] font-medium ${isCompleted ? 'text-text-tertiary line-through' : isCurrent ? 'text-purple' : 'text-text-primary'}`}>
                      {p.bfTarget}% Body Fat {p.bfTarget === targetBf ? '(Goal)' : ''}
                    </div>
                    {!isCompleted && (
                      <div className="text-[12px] text-text-secondary mt-1">
                        Est. Weight: ~{p.estWeight.toFixed(1)} kg
                      </div>
                    )}
                  </div>
                  <div className={`text-[12px] font-mono px-2 py-1 rounded-md ${isCompleted ? 'bg-border-tertiary text-text-secondary' : 'bg-purple/10 text-purple'}`}>
                    {isCompleted ? 'Completed' : `ETA: ${p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}`}
                  </div>
                </div>
              </div>
            );
          })}
          {projections.length === 0 && (
            <div className="text-[12px] text-text-secondary">Provide valid goal info to see projections.</div>
          )}
        </div>
      </div>
    </div>
  );
}
