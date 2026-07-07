import { useState } from 'react';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';
import { Target, Scale } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateProjections } from '@/shared/utils/projectionEngine';
import { profileService } from '@/features/profile/services/profileService';
import { weightService } from '../services/weightService';
import { complianceService } from '@/features/reports/services/complianceService';

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

export function ProgressPage() {
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const showAdvanced = useDashboardStore(s => s.temporaryPreferences.showAdvanced || false);
  const setShowAdvanced = (val: boolean) => useDashboardStore.getState().setTemporaryPreferences({ showAdvanced: val });
  
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: complianceScores } = useQuery({ queryKey: ['complianceScores'], queryFn: () => complianceService.getScores() });
  const complianceScore = complianceScores?.weeklyAverage || 80;
  const { data: weightLogs = [] } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile?.weight || 80;

  let actualPace = 0;
  if (weightLogs.length > 1) {
    const firstLog = weightLogs[0];
    const lastLog = weightLogs[weightLogs.length - 1];
    const elapsedMs = new Date(lastLog.date).getTime() - new Date(firstLog.date).getTime();
    const elapsedDays = elapsedMs / 86400000;
    const weightDiff = firstLog.weight - lastLog.weight;
    if (elapsedDays > 0) {
      actualPace = weightDiff / (elapsedDays / 7); // kg lost per week
    }
  }

  const projections = calculateProjections({
    currentWeight,
    currentBf: goal?.current_bf || 25,
    targetBf: goal?.target_bf || 12,
    weeklyDeficitKcal: goal?.deficit_kcal ? goal.deficit_kcal * 7 : 3500,
    complianceScore: complianceScore || 80,
    actualPaceKgPerWeek: actualPace > 0 ? actualPace : undefined
  });
  
  const addWeightMutation = useMutation({
    mutationFn: async (val: number) => {
      // First update profile measurements if provided
      if (showAdvanced) {
        const updates: any = {};
        if (waist) updates.waist = parseFloat(waist);
        if (neck) updates.neck = parseFloat(neck);
        if (hip) updates.hip = parseFloat(hip);
        if (Object.keys(updates).length > 0) {
          await profileService.updateProfile(updates);
        }
      }
      return weightService.addWeightLog({
        weight: val,
        date: getLocalDateString(new Date())
      }, showAdvanced);
    },
    onMutate: async (val: number) => {
      await queryClient.cancelQueries({ queryKey: ['weightLogs'] });
      const previousWeightLogs = queryClient.getQueryData(['weightLogs']);
      
      const newLog = {
        weight: val,
        date: getLocalDateString(new Date()),
        id: 'opt-' + Date.now(),
      };
      
      queryClient.setQueryData(['weightLogs'], (old: any) => {
        if (!old) return [newLog];
        
        // Find if an entry for today already exists
        const todayPrefix = newLog.date.substring(0, 10);
        const existingIndex = old.findIndex((l: any) => l.date.startsWith(todayPrefix));
        
        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = { ...updated[existingIndex], weight: val };
          return updated;
        }
        
        return [...old, newLog];
      });

      setWeight('');
      setWaist('');
      setNeck('');
      setHip('');
      setShowAdvanced(false);

      return { previousWeightLogs };
    },
    onError: (err, val, context) => {
      if (context?.previousWeightLogs) {
        queryClient.setQueryData(['weightLogs'], context.previousWeightLogs);
      }
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['weightLogs'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['goal'] }),
        complianceService.updateTodayScore().then(() => 
          queryClient.invalidateQueries({ queryKey: ['complianceScore'] })
        ).catch(console.error)
      ]);
    }
  });

  const handleLog = () => {
    const val = parseFloat(weight);
    if (!val) return;
    addWeightMutation.mutate(val);
  };

  const chartData = weightLogs.map((log) => {
    // Some dates might be YYYY-MM-DD or full ISO
    // The timestamp makes it work correctly on XAxis with type="number"
    const parsedDate = new Date(log.date);
    // If log.date is just YYYY-MM-DD, the timezone could shift it, but we can display as UTC
    const name = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return {
      name,
      timestamp: parsedDate.getTime(),
      weight: log.weight
    };
  });

  if (chartData.length === 0) {
    const now = Date.now();
    chartData.push({ name: 'Start', weight: currentWeight, timestamp: now - 86400000 });
    chartData.push({ name: 'Today', weight: currentWeight, timestamp: now });
  } else if (chartData.length === 1) {
    const single = chartData[0];
    // Add a dummy point 1 day earlier so area chart renders a line
    chartData.unshift({
      name: 'Start',
      weight: single.weight,
      timestamp: single.timestamp - 86400000
    });
  }

  return (
    <div className="screen-container screen-enter">
      <div className="mb-4">
        <h2 className="text-[18px] font-medium text-text-primary mb-1">Morning Weight</h2>
        <p className="text-[12px] text-text-secondary">Log your weight daily to track your physique timeline.</p>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <input 
            type="number" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
            placeholder={`Weight e.g. ${currentWeight}kg`} 
            className="input-field"
            disabled={addWeightMutation.isPending}
          />
          <button 
            onClick={handleLog} 
            disabled={addWeightMutation.isPending} 
            className="disabled:opacity-50 tracking-widest text-[12px] uppercase"
            style={{ background: '#D4FF00', color: '#0A0A0A', fontWeight: 700, border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}
          >
            {addWeightMutation.isPending ? '...' : 'Log'}
          </button>
        </div>
        
        <div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="text-[11px] text-purple hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            {showAdvanced ? '- Hide Measurements Check-in' : '+ Update body measurements (monthly)'}
          </button>
          
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
              <input 
                type="number" 
                value={waist} 
                onChange={(e) => setWaist(e.target.value)} 
                placeholder={`Waist (cm) e.g. ${profile?.waist || 85}`} 
                className="input-field disabled:opacity-50"
                disabled={addWeightMutation.isPending}
              />
              <input 
                type="number" 
                value={neck} 
                onChange={(e) => setNeck(e.target.value)} 
                placeholder={`Neck (cm) e.g. ${profile?.neck || 38}`} 
                className="input-field disabled:opacity-50"
                disabled={addWeightMutation.isPending}
              />
              {profile?.gender === 'Female' && (
                <input 
                  type="number" 
                  value={hip} 
                  onChange={(e) => setHip(e.target.value)} 
                  placeholder={`Hip (cm) e.g. ${profile?.hip || 95}`} 
                  className="col-span-2 input-field disabled:opacity-50"
                  disabled={addWeightMutation.isPending}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div className="flex justify-between items-center mb-3">
          <div className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'rgba(235,235,245,0.5)' }}>Weight Trend</div>
          {actualPace !== 0 && (
            <div className="text-[11px] font-medium" style={{ color: actualPace > 0 ? '#D4FF00' : '#FF2D55' }}>
              {Math.abs(actualPace).toFixed(2)} kg/wk {actualPace > 0 ? 'lost' : 'gained'}
            </div>
          )}
        </div>
        {weightLogs.length > 0 ? (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis 
                  dataKey="timestamp" 
                  type="number" 
                  scale="time" 
                  domain={['dataMin', 'dataMax']} 
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} 
                  tick={{ fontSize: 10, fill: 'rgba(235,235,245,0.5)' }} 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={20}
                />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: 'rgba(235,235,245,0.5)' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  labelFormatter={(val) => {
                    const d = chartData.find(c => c.timestamp === val);
                    return d ? d.name : new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                  }}
                  contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: 'white' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#D4FF00" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[150px] flex items-center justify-center text-[12px] text-text-secondary border-[0.5px] border-dashed border-border-secondary">
            Log your weight to see trends.
          </div>
        )}
      </div>

      {projections.length > 0 && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: '40px' }}>
          <div className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: 'rgba(235,235,245,0.5)' }}>Milestone Projections</div>
          <div className="flex flex-col gap-3">
            {projections.map((p, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.06)] last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-text-primary">{p.bfTarget}% BF</span>
                  <span className="text-[12px] text-text-secondary">~{p.estWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-medium text-text-primary">
                    {p.status === 'completed' ? 'Completed' : p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[12px]" style={{ color: p.status === 'completed' ? '#D4FF00' : 'rgba(235,235,245,0.5)' }}>
                    {p.status === 'completed' ? 'Achieved' : `in ${p.weeks} weeks`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[10px] text-text-secondary text-center">
            {actualPace > 0 
              ? `Projections based on your actual pace of ${actualPace.toFixed(2)} kg/wk lost.`
              : `Based on current ${complianceScore.toFixed(0)}% compliance and ${(goal?.deficit_kcal || 500) * 7} kcal weekly deficit.`
            }
          </div>
        </div>
      )}
    </div>
  );
}
