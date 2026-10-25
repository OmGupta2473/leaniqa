import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

  const [view, setView] = React.useState<'calories' | 'protein'>('calories');

  if (data.length === 0) {
    return (
      <div className={cn('flex h-48 items-center justify-center text-[rgba(255,255,255,0.3)]', className)}>
        No trend data available
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-white">
          {view === 'calories' ? 'Calories' : 'Protein'} Trend
        </h3>
        <div className="flex gap-1.5">
          <button
            onClick={() => setView('calories')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              view === 'calories'
                ? 'bg-[#D4FF00] text-[#0A0A0A]'
                : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            Calories
          </button>
          <button
            onClick={() => setView('protein')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              view === 'protein'
                ? 'bg-[#D4FF00] text-[#0A0A0A]'
                : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            Protein
          </button>
        </div>
      </div>

      <div className="h-48" style={{ width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickMargin={4}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, view === 'calories' ? maxCalories * 1.15 : maxProtein * 1.15]}
              tickFormatter={(v) => (view === 'calories' ? `${v}kcal` : `${v}g`)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1C',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
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
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              iconType="line"
              wrapperStyle={{ paddingTop: 8 }}
            />
            {view === 'calories' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#D4FF00"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  name="Calories"
                />
                <Line
                  type="monotone"
                  dataKey="targetCalories"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Target"
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="proteinG"
                  stroke="#00B4D8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  name="Protein"
                />
                <Line
                  type="monotone"
                  dataKey="targetProteinG"
                  stroke="rgba(0,180,216,0.3)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Target"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}