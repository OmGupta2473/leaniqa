import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';
import { Target, Scale, TrendingDown, TrendingUp, LineChart, Loader2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateProjections } from '@/shared/utils/projectionEngine';
import { profileService } from '@/features/profile/services/profileService';
import { weightService } from '../services/weightService';
import { complianceService } from '@/features/reports/services/complianceService';
import { motion } from "motion/react";
import { cn } from "@/shared/utils/utils";
import { EmptyState } from '@/shared/components/EmptyState';
import { useNetworkConnectivity } from "@/shared/hooks/useNetworkConnectivity";
import { ProgressSkeleton } from '@/shared/components/Skeletons';

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

export function ProgressPage() {
  const [weight, setWeight] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const showAdvanced = useDashboardStore(s => s.temporaryPreferences.showAdvanced || false);
  const setShowAdvanced = (val: boolean) => useDashboardStore.getState().setTemporaryPreferences({ showAdvanced: val });
  
  const navigate = useNavigate();
  const isOnline = useNetworkConnectivity();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: complianceScores } = useQuery({ queryKey: ['complianceScores'], queryFn: () => complianceService.getScores() });
  const complianceScore = complianceScores?.weeklyAverage || 80;
  const { data: weightLogs = [], isLoading } = useQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });

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
      let updates: any = {};
      if (showAdvanced) {
        if (waist) updates.waist = parseFloat(waist);
        if (neck) updates.neck = parseFloat(neck);
        if (hip) updates.hip = parseFloat(hip);
      }

      if (typeof window !== 'undefined' && !navigator.onLine) {
        const { offlineSyncService } = await import('@/shared/services/offlineSyncService');
        offlineSyncService.enqueue({
          type: 'ADD_WEIGHT',
          payload: { weight: val, date: getLocalDateString(new Date()), updates, showAdvanced }
        });
        return { weight: val, date: getLocalDateString(new Date()), _localOnly: true };
      }

      if (Object.keys(updates).length > 0) {
        await profileService.updateProfile(updates);
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
        _localOnly: typeof window !== 'undefined' && !navigator.onLine
      };
      
      queryClient.setQueryData(['weightLogs'], (old: any) => {
        if (!old) return [newLog];
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

  const todayPrefix = getLocalDateString(new Date()).substring(0, 10);
  const hasLoggedToday = weightLogs.some((l: any) => l.date.startsWith(todayPrefix));

  const handleLog = (isUpdate = false) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setErrorMsg('');
    const val = parseFloat(weight);
    if (!val) return;

    if (!isUpdate && hasLoggedToday) {
      setErrorMsg("You've already logged your weight today. If you entered the wrong weight, use the 'Update Today's Weight' option to edit it.");
      return;
    }

    const previousLogs = weightLogs.filter((l: any) => !l.date.startsWith(todayPrefix));
    if (previousLogs.length > 0) {
      const lastWeight = previousLogs[previousLogs.length - 1].weight;
      const diff = Math.abs(val - lastWeight);
      if (diff > 5) {
        setErrorMsg(`A weight change of ${diff.toFixed(1)} kg since your last logged weight is not realistically possible. Please check your entry.`);
        return;
      }
    }

    addWeightMutation.mutate(val);
  };

  const chartData = weightLogs.map((log) => {
    const parsedDate = new Date(log.date);
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
    chartData.unshift({
      name: 'Start',
      weight: single.weight,
      timestamp: single.timestamp - 86400000
    });
  }

  if (isLoading) {
    if (!isOnline) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex flex-col items-center justify-center px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-[rgba(255,255,255,0.2)] mb-4" />
          <h2 className="text-[18px] font-semibold text-white mb-2">You're offline</h2>
          <p className="text-[14px] text-[rgba(255,255,255,0.6)]">
            Connect to the internet to load your progress for the first time.
          </p>
          <button onClick={() => navigate('/dashboard')} className="mt-8 text-[#D4FF00] font-medium text-[15px]">
            Return to Dashboard
          </button>
        </div>
      );
    }
    return <ProgressSkeleton />;
  }

  return (
    <div className="page-enter px-5 py-4 min-h-[100dvh] bg-[#0A0A0A] pb-[calc(100px+env(safe-area-inset-bottom))]">
      <div className="mb-6 mt-2">
        <h2 className="text-[22px] font-semibold text-white tracking-tight mb-1">Progress</h2>
        <p className="text-[13px] text-[rgba(255,255,255,0.45)]">Track your body transformation journey.</p>
      </div>

      <div className="card-base p-4 mb-6">
        <div className="text-[13px] font-semibold text-white mb-3">Morning Weight</div>
        {errorMsg && (
          <div className="p-3 bg-[rgba(255,45,85,0.1)] text-[#FF2D55] text-[12px] rounded-[20px] border border-[rgba(255,45,85,0.2)] mb-3">
            {errorMsg}
          </div>
        )}
        <div className="flex gap-2">
          <input 
            type="number" 
            value={weight} 
            onChange={(e) => {
              setWeight(e.target.value);
              setErrorMsg('');
            }} 
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }}
            placeholder={`e.g. ${currentWeight} kg`} 
            className="input-apple flex-1"
            disabled={addWeightMutation.isPending}
          />
          <button 
            onClick={() => handleLog(hasLoggedToday)} 
            disabled={addWeightMutation.isPending || !weight} 
            className="btn-primary w-auto px-6 disabled:opacity-50"
          >
            {addWeightMutation.isPending ? '...' : (hasLoggedToday ? 'Update' : 'Log')}
          </button>
        </div>
        
        <div className="mt-4">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="text-[12px] text-[#D4FF00] hover:underline bg-transparent border-none cursor-pointer p-0 font-medium opacity-80"
          >
            {showAdvanced ? 'Hide Measurements' : 'Update Body Measurements (Optional)'}
          </button>
          
          {showAdvanced && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-3 mt-3 overflow-hidden">
              <input 
                type="number" 
                value={waist} 
                onChange={(e) => setWaist(e.target.value)} 
                onFocus={(e) => {
                  const target = e.target;
                  setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                placeholder={`Waist (cm)`} 
                className="input-apple disabled:opacity-50"
                disabled={addWeightMutation.isPending}
              />
              <input 
                type="number" 
                value={neck} 
                onChange={(e) => setNeck(e.target.value)} 
                onFocus={(e) => {
                  const target = e.target;
                  setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                placeholder={`Neck (cm)`} 
                className="input-apple disabled:opacity-50"
                disabled={addWeightMutation.isPending}
              />
              {profile?.gender === 'Female' && (
                <input 
                  type="number" 
                  value={hip} 
                  onChange={(e) => setHip(e.target.value)} 
                  onFocus={(e) => {
                    const target = e.target;
                    setTimeout(() => {
                      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                  placeholder={`Hip (cm)`} 
                  className="col-span-2 input-apple disabled:opacity-50"
                  disabled={addWeightMutation.isPending}
                />
              )}
            </motion.div>
          )}
        </div>
      </div>

      <div className="card-base p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[13px] font-semibold text-white">Weight Trend</div>
          {actualPace !== 0 && (
            <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.03)] px-2.5 py-1 rounded-full">
              {actualPace > 0 ? <TrendingDown size={12} className="text-[#D4FF00]" /> : <TrendingUp size={12} className="text-[#FF4D1C]" />}
              <div className="text-[11px] font-semibold" style={{ color: actualPace > 0 ? '#D4FF00' : '#FF4D1C' }}>
                {Math.abs(actualPace).toFixed(2)} kg/wk
              </div>
            </div>
          )}
        </div>
        {weightLogs.length > 0 ? (
          <div className="h-[220px] w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#D4FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="timestamp" 
                  type="number" 
                  scale="time" 
                  domain={['dataMin', 'dataMax']} 
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.32)' }} 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={30}
                  dy={10}
                />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.32)' }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  labelFormatter={(val) => {
                    const d = chartData.find(c => c.timestamp === val);
                    return d ? d.name : new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                  }}
                  contentStyle={{ backgroundColor: '#1A1A1C', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginBottom: '4px' }}
                  itemStyle={{ color: '#D4FF00', fontSize: '13px', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="weight" stroke="#D4FF00" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={LineChart}
              title="No weight logged yet"
              description="Log your morning weight consistently to start unlocking trends and timeline projections."
              className="py-10"
            />
          </div>
        )}
      </div>

      {projections.length > 0 && (
        <div className="card-base p-5 mb-10">
          <div className="text-[13px] font-semibold text-white mb-6">Milestone Roadmap</div>
          <div className="flex flex-col relative pb-2">
            <div className="absolute left-[18px] top-[8px] bottom-[24px] w-[1px] bg-[rgba(255,255,255,0.1)]"></div>
            {projections.map((p, i) => {
              const isCompleted = p.status === 'completed';
              return (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="flex justify-between items-center py-3 relative z-10 pl-[42px]">
                  <div className={cn("absolute left-[14px] w-[9px] h-[9px] rounded-full top-1/2 -translate-y-1/2", isCompleted ? 'bg-[#D4FF00] shadow-[0_0_8px_rgba(212,255,0,0.5)]' : 'border-[1.5px] border-[rgba(255,255,255,0.2)] bg-[#111113]')}></div>
                  
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-white tracking-tight">{p.bfTarget}% BF</span>
                    <span className="text-[13px] text-[rgba(235,235,245,0.5)] mt-0.5">~{p.estWeight.toFixed(1)} kg</span>
                  </div>
                  <div className="flex flex-col items-end">
                    {isCompleted ? (
                      <span className="badge-lime px-2 py-0.5 text-[10px]">Achieved</span>
                    ) : (
                      <>
                        <span className="text-[13px] font-medium text-white tracking-tight">{p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-[11px] text-[rgba(255,255,255,0.4)] mt-0.5">in {p.weeks} weeks</span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-[rgba(255,255,255,0.35)] text-center leading-relaxed">
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
