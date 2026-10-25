import React from 'react';
import { cn } from '@/shared/utils/utils';

interface StreakCounterProps {
  calorie: { current: number; longest: number; inProgress: boolean };
  protein: { current: number; longest: number; inProgress: boolean };
  className?: string;
}

export function StreakCounter({
  calorie,
  protein,
  className,
}: StreakCounterProps) {
  const formatStreak = (n: number) => n.toLocaleString();

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {/* Calorie Streak */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.4)]">
            Calorie Streak
          </span>
          {calorie.inProgress && (
            <span className="ml-auto text-[10px] font-medium text-[#D4FF00] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse" />
              In progress
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[36px] font-bold text-white tabular-nums">
            {formatStreak(calorie.current)}
          </span>
          <span className="text-[13px] text-[rgba(255,255,255,0.4)]">days</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
          <span className="text-[rgba(255,255,255,0.35)]">Longest:</span>
          <span className="font-semibold text-white tabular-nums">{formatStreak(calorie.longest)}</span>
        </div>
      </div>

      {/* Protein Streak */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.4)]">
            Protein Streak
          </span>
          {protein.inProgress && (
            <span className="ml-auto text-[10px] font-medium text-[#00B4D8] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] animate-pulse" />
              In progress
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[36px] font-bold text-white tabular-nums">
            {formatStreak(protein.current)}
          </span>
          <span className="text-[13px] text-[rgba(255,255,255,0.4)]">days</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
          <span className="text-[rgba(255,255,255,0.35)]">Longest:</span>
          <span className="font-semibold text-white tabular-nums">{formatStreak(protein.longest)}</span>
        </div>
      </div>
    </div>
  );
}