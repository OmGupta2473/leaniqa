import { useState } from 'react';
import { useAppStore } from '../store';
import { Target, Scale } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ProgressScreen() {
  const { profile, goal, weightLogs, addWeightLog } = useAppStore();
  const [weight, setWeight] = useState('');

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile?.weight || 80;
  
  const handleLog = () => {
    const val = parseFloat(weight);
    if (!val) return;
    addWeightLog({
      id: Date.now().toString(),
      weight: val,
      date: new Date().toISOString()
    });
    setWeight('');
  };

  const chartData = weightLogs.map((log, i) => ({
    name: `Day ${i + 1}`,
    weight: log.weight
  }));

  if (chartData.length === 0) {
    chartData.push({ name: 'Start', weight: currentWeight });
  }

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
        />
        <button onClick={handleLog} className="px-4 py-2 border-none bg-purple text-background-primary font-bold uppercase tracking-widest text-[12px] cursor-pointer">Log</button>
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
        <div className="text-[11px] font-medium uppercase tracking-widest text-text-secondary mb-3">Body Fat Projection</div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-text-primary">20% Body Fat</div>
            <div className="text-[12px] text-text-secondary font-mono">Completed</div>
          </div>
          <div className="h-[1px] bg-border-tertiary"></div>
          
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-text-primary">18% Body Fat</div>
            <div className="text-[12px] text-purple font-mono">In 3 weeks</div>
          </div>
          <div className="h-[1px] bg-border-tertiary"></div>
          
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-text-primary">15% Body Fat</div>
            <div className="text-[12px] text-text-secondary font-mono">In 9 weeks</div>
          </div>
          <div className="h-[1px] bg-border-tertiary"></div>
          
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-text-primary">12% Body Fat (Goal)</div>
            <div className="text-[12px] text-text-secondary font-mono">In 15 weeks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
