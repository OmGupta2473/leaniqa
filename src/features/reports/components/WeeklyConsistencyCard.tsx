import React from 'react';
import { cn } from '@/shared/utils/utils';

interface WeeklyConsistencyCardProps {
  report: {
    target_calories: number;
    target_protein_g: number;
    day_summaries: Array<{
      date: string;
      calories: number;
      proteinG: number;
      logged: boolean;
      isToday: boolean;
    }>;
    targets?: {
      calories: number;
      protein: number;
    };
  } | null;
  className?: string;
}

function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function WeeklyConsistencyCard({
  report,
  className,
}: WeeklyConsistencyCardProps) {
  const completedDays = report?.day_summaries.filter((d) => d.logged && !d.isToday) ?? [];
  const totalCompleted = completedDays.length;

  // Compute consistency score: percentage of days meeting EITHER goal
  let score = 0;
  let proteinGoalDays = 0;
  let calorieGoalDays = 0;
  let goalDays = 0;

  if (totalCompleted > 0) {
    for (const day of completedDays) {
      const calorieHit = day.calories >= 0.9 * (report.targets?.calories ?? report?.target_calories ?? 2000) &&
                         day.calories <= 1.1 * (report.targets?.calories ?? report?.target_calories ?? 2000);
      const proteinHit = day.proteinG >= 0.9 * (report.targets?.protein ?? report?.target_protein_g ?? 150);

      if (calorieHit) calorieGoalDays++;
      if (proteinHit) proteinGoalDays++;
      if (calorieHit || proteinHit) goalDays++;
    }
  }

  const scoreValue = totalCompleted > 0 ? Math.round((goalDays / totalCompleted) * 100) : 0;

  // Ring progress
  const circumference = 2 * Math.PI * 54; // r = 54
  const strokeDashoffset = circumference - (scoreValue / 100) * circumference;

  if (totalCompleted === 0) {
    return (
      <div className={cn(
        'rounded-[24px] border border-white/5 bg-white/[0.03] p-6 md:p-8',
        className
      )}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5 flex items-center justify-center relative">
              <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#D4FF00"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="226.2"
                  strokeDashoffset="226.2"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(212,255,0,0.5))' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold text-white">0</span>
                <span className="text-xs uppercase tracking-widest text-zinc-500 block mt-1">SCORE</span>
              </div>
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-lg font-semibold text-white">Weekly Consistency</p>
            <p className="text-zinc-500 mt-1">Not enough data yet — no completed days this week</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-[24px] border border-white/5 bg-white/[0.03] p-6 md:p-8',
      className
    )}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        {/* Progress Ring */}
        <div className="flex flex-col items-center md:w-48 md:h-48 md:shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="#D4FF00"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 - (scoreValue / 100) * 2 * Math.PI * 54}
              style={{
                filter: 'drop-shadow(0 0 10px rgba(212,255,0,0.5))',
                transition: 'stroke-dashoffset 0.8s ease-out',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl md:text-5xl font-bold text-white">{scoreValue}</span>
              <span className="text-xs uppercase tracking-widest text-zinc-500 block mt-1">SCORE</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 flex-1">
          <div className="text-center md:text-left">
            <h3 className="text-lg md:text-xl font-semibold text-white">Weekly Consistency</h3>
            <p className="text-zinc-400 mt-1 text-sm md:text-base">
              {totalCompleted} of 7 days completed
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 mt-4 md:mt-0">
            {/* Protein Goal */}
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#378ADD]" />
              <span className="text-sm font-medium text-white">
                Protein {proteinGoalDays}/{totalCompleted}
              </span>
            </div>
            {/* Calorie Goal */}
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D1C]" />
              <span className="text-sm font-medium text-white">
                Calories {calorieGoalDays}/{totalCompleted}
              </span>
            </div>
            {/* Goal Days */}
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
              <span className="text-sm font-medium text-[#0A0A0A]">
                Goal Days {goalDays}/{totalCompleted}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}