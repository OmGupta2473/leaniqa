import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/shared/utils/utils';

interface TrendChartProps {
  points: ReadonlyArray<{
    date: string;
    calories: number;
    proteinG: number;
  }>;
  targetCalories: number;
  targetProteinG: number;
  trendView: '7d' | '30d';
  onTrendViewChange: (view: '7d' | '30d') => void;
  className?: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

export function TrendChart({
  points,
  targetCalories,
  targetProteinG,
  trendView,
  onTrendViewChange,
  className,
}: TrendChartProps) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        date: p.date,
        label: formatDateLabel(p.date),
        calories: p.calories,
        proteinG: p.proteinG,
        targetCalories,
        targetProteinG,
      })),
    [points, targetCalories, targetProteinG],
  );

  const maxCalories = useMemo(
    () =>
      Math.max(
        targetCalories,
        ...data.map((d) => d.calories),
      ),
    [data, targetCalories],
  );

  const maxProtein = useMemo(
    () =>
      Math.max(
        targetProteinG,
        ...data.map((d) => d.proteinG),
      ),
    [data, targetProteinG],
  );

  const [view, setView] = useState<'calories' | 'protein'>('calories');

  if (data.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/5 bg-white/[0.03] p-6 md:p-8 h-[300px]">
        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
          <p className="text-lg font-medium text-white mb-2">No trend data available</p>
          <p className="text-zinc-500 text-sm">Log meals to see your trend</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/5 bg-white/[0.03] p-6 md:p-8">
      {/* Header with Calories/Protein toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-white">Calories Trend</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setView('calories')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === 'calories'
                ? 'bg-[#D4FF00] text-[#0A0A0A] shadow-[0_0_10px_rgba(212,255,0,0.3)]'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            Calories
          </button>
          <button
            onClick={() => setView('protein')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === 'protein'
                ? 'bg-[#D4FF00] text-[#0A0A0A] shadow-[0_0_10px_rgba(212,255,0,0.3)]'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            Protein
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] md:h-[350px] mb-6" style={{ width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              interval={0}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, view === 'calories' ? maxCalories * 1.15 : maxProtein * 1.15]}
              tickFormatter={(v) => (view === 'calories' ? `${v}kcal` : `${v}g`)}
              tickCount={4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111111',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              formatter={(value: number, name: string) => {
                if (name === 'calories') return [`${value}kcal`, 'Calories'];
                if (name === 'proteinG') return [`${value}g`, 'Protein'];
                if (name === 'targetCalories') return [`${value}kcal`, 'Target'];
                if (name === 'targetProteinG') return [`${value}g`, 'Target'];
                return [value, name];
              }}
            />
            <ReferenceLine
              y={view === 'calories' ? targetCalories : targetProteinG}
              stroke="#D4FF00"
              strokeWidth={2}
              strokeDasharray="6 6"
              label={{ position: 'right', fill: '#D4FF00', fontSize: 10, offset: 8 }}
            />
            {view === 'calories' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#D4FF00"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#D4FF00', strokeWidth: 2, stroke: '#0A0A0A' }}
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="proteinG"
                  stroke="#00B4D8"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#00B4D8', strokeWidth: 2, stroke: '#0A0A0A' }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer: Legend + 7/30 Day Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center justify-center md:justify-start gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />
            <span className="text-sm text-zinc-400">Calories</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[rgba(212,255,0,0.5)]" />
            <span className="text-sm text-zinc-400">Target</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onTrendViewChange('7d')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              trendView === '7d'
                ? 'bg-[#D4FF00] text-[#0A0A0A] shadow-[0_0_10px_rgba(212,255,0,0.3)]'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            7 Day
          </button>
          <button
            onClick={() => onTrendViewChange('30d')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              trendView === '30d'
                ? 'bg-[#D4FF00] text-[#0A0A0A] shadow-[0_0_10px_rgba(212,255,0,0.3)]'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            30 Day
          </button>
        </div>
      </div>
    </div>
  );
}