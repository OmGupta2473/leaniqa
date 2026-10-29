import React from 'react';
import { cn } from '@/shared/utils/utils';

// Shared shimmer primitive — same class the pre-existing skeletons used inline.
// Centralised so every block in every skeleton uses one token, and so future
// skeletons added to this file stay visually consistent.
const shimmerBlock = 'bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none';

export function DashboardSkeleton() {
  return (
    <div className="page-enter px-4 pb-[calc(80px+env(safe-area-inset-bottom))] pt-6 space-y-4 min-h-[100dvh] bg-[#0A0A0A]">
      {/* Header — "Ready, X" + date on left, plan chip + streak on right */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className={`h-[22px] w-40 ${shimmerBlock} rounded-lg mb-2`} />
          <div className={`h-[14px] w-32 ${shimmerBlock} rounded-lg`} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`h-[30px] w-[100px] ${shimmerBlock} rounded-full`} />
          <div className={`h-[30px] w-[52px] ${shimmerBlock} rounded-full`} />
        </div>
      </div>

      {/* Calories Hero card */}
      <div className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-5">
          <div className={`h-[12px] w-16 ${shimmerBlock} rounded`} />
          <div className={`h-4 w-4 ${shimmerBlock} rounded`} />
        </div>
        <div className="flex items-baseline gap-2 mb-6">
          <div className={`h-[36px] w-20 ${shimmerBlock} rounded-lg`} />
          <div className={`h-[20px] w-16 ${shimmerBlock} rounded-lg`} />
          <div className={`h-[13px] w-8 ${shimmerBlock} rounded`} />
        </div>
        <div className="flex items-center gap-6">
          <div className={`w-[100px] h-[100px] rounded-full ${shimmerBlock} shrink-0`} />
          <div className="flex flex-col gap-2 flex-1">
            <div className={`h-[24px] w-24 ${shimmerBlock} rounded-lg`} />
            <div className={`h-[14px] w-20 ${shimmerBlock} rounded-lg`} />
            <div className={`h-[12px] w-24 ${shimmerBlock} rounded mt-1`} />
          </div>
        </div>
      </div>

      {/* Macronutrients — 3 rows with 8×8 icon wells + 2px bars */}
      <div className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-7">
          <div className={`h-[12px] w-24 ${shimmerBlock} rounded`} />
          <div className={`h-[12px] w-16 ${shimmerBlock} rounded`} />
        </div>
        <div className="flex flex-col gap-7">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-[12px] ${shimmerBlock}`} />
                  <div className={`h-[15px] w-16 ${shimmerBlock} rounded-lg`} />
                </div>
                <div className={`h-[15px] w-20 ${shimmerBlock} rounded-lg`} />
              </div>
              <div className={`w-full h-2 rounded-full ${shimmerBlock}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Weight + Daily Score 2-col grid — both real cards are h-[140px] p-5 */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[24px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] h-[140px] flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-2">
              <div className={`h-[11px] w-16 ${shimmerBlock} rounded`} />
              <div className={`h-4 w-4 ${shimmerBlock} rounded`} />
            </div>
            <div>
              <div className={`h-[24px] w-20 ${shimmerBlock} rounded-lg mb-2`} />
              <div className={`h-[12px] w-24 ${shimmerBlock} rounded-lg`} />
            </div>
          </div>
        ))}
      </div>

      {/* Smart Suggestion card */}
      <div className="rounded-[24px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 ${shimmerBlock} rounded`} />
            <div className={`h-[11px] w-32 ${shimmerBlock} rounded`} />
          </div>
          <div className={`h-4 w-4 ${shimmerBlock} rounded`} />
        </div>
        <div className={`h-[16px] w-48 ${shimmerBlock} rounded-lg mb-3`} />
        <div className="flex flex-wrap gap-2">
          <div className={`h-[22px] w-16 ${shimmerBlock} rounded-md`} />
          <div className={`h-[22px] w-20 ${shimmerBlock} rounded-md`} />
          <div className={`h-[22px] w-16 ${shimmerBlock} rounded-md`} />
          <div className={`h-[22px] w-16 ${shimmerBlock} rounded-md`} />
        </div>
      </div>
    </div>
  );
}

export function AwardsSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#000000] px-5">
      {/* Header — back + title + count pill */}
      <div className="flex items-center justify-between mb-10">
        <div className={`w-9 h-9 rounded-full ${shimmerBlock}`} />
        <div className={`h-[17px] w-20 ${shimmerBlock} rounded-lg`} />
        <div className={`h-[26px] w-16 ${shimmerBlock} rounded-full`} />
      </div>

      {/* Streak card + Next milestone hero — 2-col grid, same as real page */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8 items-stretch">
        {/* Streak card */}
        <div className="rounded-[20px] md:rounded-[24px] p-4 md:p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex flex-col">
          <div className={`h-[13px] w-24 ${shimmerBlock} rounded-lg`} />
          <div className="flex justify-between items-start mt-3">
            <div>
              <div className={`h-[36px] w-16 ${shimmerBlock} rounded-lg mb-1`} />
              <div className={`h-[14px] w-10 ${shimmerBlock} rounded`} />
            </div>
            <div className={`w-11 h-11 rounded-full ${shimmerBlock}`} />
          </div>
          <div className="flex justify-between mt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${shimmerBlock}`} />
                <div className={`h-[9px] w-2 ${shimmerBlock} rounded`} />
              </div>
            ))}
          </div>
          <div className="h-px bg-[rgba(255,255,255,0.06)] my-3 md:my-4" />
          <div className="h-10 rounded-[16px] bg-[rgba(255,255,255,0.03)]" />
          <div className={`h-[10px] w-32 ${shimmerBlock} rounded mx-auto mt-3`} />
        </div>

        {/* Next milestone hero */}
        <div className="rounded-[22px] p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-3">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 ${shimmerBlock} rounded`} />
              <div className={`h-[9px] w-20 ${shimmerBlock} rounded`} />
            </div>
            <div className={`h-4 w-4 ${shimmerBlock} rounded`} />
          </div>
          <div className={`w-[72px] h-[72px] rounded-full ${shimmerBlock} mb-4`} />
          <div className={`h-[13px] w-24 ${shimmerBlock} rounded-lg mb-3`} />
          <div className="flex gap-1.5 mb-4">
            <div className={`h-[18px] w-14 ${shimmerBlock} rounded-full`} />
            <div className={`h-[18px] w-14 ${shimmerBlock} rounded-full`} />
          </div>
          <div className={`h-1.5 w-full ${shimmerBlock} rounded-full mb-2`} />
          <div className={`h-[10px] w-28 ${shimmerBlock} rounded mx-auto`} />
        </div>
      </div>

      {/* Award category sections — real page renders sections with heading + grid-cols-2 sm:grid-cols-3 of aspect-square cards */}
      {[1, 2].map((sectionIdx) => (
        <div key={sectionIdx} className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className={`h-[20px] w-28 ${shimmerBlock} rounded-lg`} />
            <div className="h-[1px] flex-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent ml-4" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-[24px] p-4 flex flex-col items-center justify-center bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.05)]"
              >
                <div className={`w-16 h-16 rounded-full ${shimmerBlock} mb-3`} />
                <div className={`h-[13px] w-20 ${shimmerBlock} rounded-lg mb-1`} />
                <div className={`h-[10px] w-14 ${shimmerBlock} rounded`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WeeklyReportSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      {/* Header: back w-11 + title + w-11 spacer */}
      <div className="flex items-center justify-between mb-6">
        <div className={`w-11 h-11 rounded-full ${shimmerBlock}`} />
        <div className={`h-[22px] w-32 ${shimmerBlock} rounded-lg`} />
        <div className="w-11" />
      </div>

      {/* WeekSelector: arrows row + status pill */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full gap-4">
          <div className={`w-11 h-11 rounded-full ${shimmerBlock}`} />
          <div className={`h-[17px] w-40 ${shimmerBlock} rounded-lg`} />
          <div className={`w-11 h-11 rounded-full ${shimmerBlock}`} />
        </div>
        <div className={`h-[22px] w-24 ${shimmerBlock} rounded-full`} />
      </div>

      <div className="mt-8">
        {/* Hero card — ring (148) + text column + chip row */}
        <div className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-6">
            <div className={`w-[148px] h-[148px] rounded-full ${shimmerBlock} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className={`h-[20px] w-40 ${shimmerBlock} rounded-lg mb-2`} />
              <div className={`h-[15px] w-full ${shimmerBlock} rounded mb-1`} />
              <div className={`h-[15px] w-4/5 ${shimmerBlock} rounded mb-4`} />
              <div className={`h-[12px] w-40 ${shimmerBlock} rounded mb-4`} />
              <div className="flex flex-wrap gap-2">
                <div className={`h-[26px] w-24 ${shimmerBlock} rounded-full`} />
                <div className={`h-[26px] w-24 ${shimmerBlock} rounded-full`} />
                <div className={`h-[26px] w-20 ${shimmerBlock} rounded-full`} />
              </div>
            </div>
          </div>
        </div>

        {/* Trend chart — same header row + 192px canvas */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <div className={`h-[14px] w-24 ${shimmerBlock} rounded-lg`} />
            <div className={`h-[32px] w-32 ${shimmerBlock} rounded-full`} />
          </div>
          <div className={`h-48 w-full ${shimmerBlock} rounded-xl`} />
        </div>

        {/* Day timeline — 7 columns with variable bar heights */}
        <div className="mt-6 rounded-[24px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
          <div className={`h-[12px] w-28 ${shimmerBlock} rounded mb-4`} />
          <div className="grid grid-cols-7 gap-1.5 items-end" style={{ height: 96 }}>
            {[60, 80, 70, 90, 60, 40, 50].map((h, i) => (
              <div key={i} className="flex flex-col items-center justify-end gap-1 h-full">
                <div className={`w-full ${shimmerBlock} rounded-md`} style={{ height: `${h}%` }} />
                <div className={`h-[11px] w-3 ${shimmerBlock} rounded`} />
                <div className={`h-[10px] w-3 ${shimmerBlock} rounded`} />
              </div>
            ))}
          </div>
        </div>

        {/* Comparison strip — 2×2 grid of metric cards */}
        <div className="mt-6">
          <div className={`h-[12px] w-40 ${shimmerBlock} rounded mb-3 px-1`} />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-[24px] p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-9 h-9 rounded-full ${shimmerBlock}`} />
                  <div className={`h-[10px] w-20 ${shimmerBlock} rounded`} />
                </div>
                <div className={`h-[26px] w-20 ${shimmerBlock} rounded-lg mb-1`} />
                <div className={`h-[12px] w-24 ${shimmerBlock} rounded mb-3`} />
                <div className={`h-[3px] w-full ${shimmerBlock} rounded-full mb-3`} />
                <div className={`h-[12px] w-24 ${shimmerBlock} rounded mb-1`} />
                <div className={`h-[11px] w-20 ${shimmerBlock} rounded`} />
              </div>
            ))}
          </div>
        </div>

        {/* Coach summary card */}
        <div className="mt-6 rounded-[24px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2 mb-3">
            <div className={`h-4 w-4 ${shimmerBlock} rounded`} />
            <div className={`h-[12px] w-28 ${shimmerBlock} rounded`} />
          </div>
          <div className={`h-[15px] w-full ${shimmerBlock} rounded mb-2`} />
          <div className={`h-[15px] w-full ${shimmerBlock} rounded mb-2`} />
          <div className={`h-[15px] w-3/4 ${shimmerBlock} rounded`} />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="page-enter min-h-[100dvh] bg-[#0A0A0A] w-full px-[clamp(1rem,4vw,1.5rem)] pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+100px)]">
      <div className="w-full max-w-md mx-auto md:max-w-2xl lg:max-w-6xl">
        {/* Header card — matches md:rounded-2xl wrapper on real page */}
        <div className="md:rounded-2xl md:border md:border-zinc-800/60 md:bg-zinc-900/40 mb-[clamp(1rem,2.4dvh,1.5rem)] md:mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className={`w-8 h-8 rounded-full ${shimmerBlock}`} />
            <div className={`h-[17px] w-16 ${shimmerBlock} rounded-lg`} />
            <div className="w-8" />
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full ${shimmerBlock} mb-4`} />
            <div className={`h-[24px] w-32 ${shimmerBlock} rounded-lg mb-2`} />
            <div className="flex gap-2">
              <div className={`h-[22px] w-16 ${shimmerBlock} rounded-full`} />
              <div className={`h-[22px] w-16 ${shimmerBlock} rounded-full`} />
              <div className={`h-[22px] w-20 ${shimmerBlock} rounded-full`} />
            </div>
          </div>
        </div>

        {/* Card grid — matches real page: grid-cols-1 md:grid-cols-2 */}
        <div className="grid grid-cols-1 gap-[clamp(0.6rem,1.6dvh,1rem)] md:grid-cols-2 md:gap-4">
          {/* Your Plan card */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]">
            <div className="flex justify-between items-center mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
              <div className={`h-[10px] w-16 ${shimmerBlock} rounded`} />
              <div className={`h-[10px] w-10 ${shimmerBlock} rounded`} />
            </div>
            <div className={`h-[18px] w-32 ${shimmerBlock} rounded-lg mb-3`} />
            <div className={`h-[26px] w-28 ${shimmerBlock} rounded-lg mb-3`} />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-[52px] rounded-xl bg-zinc-800/50 border border-zinc-800 ${shimmerBlock}`}
                />
              ))}
            </div>
          </div>

          {/* Maintenance + Projected Progress cards (same shape) */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]"
            >
              <div className="flex justify-between items-center mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
                <div className={`h-[10px] w-20 ${shimmerBlock} rounded`} />
                <div className={`h-[10px] w-10 ${shimmerBlock} rounded`} />
              </div>
              <div className={`h-[24px] w-24 ${shimmerBlock} rounded-lg mb-3`} />
              <div className={`h-[14px] w-32 ${shimmerBlock} rounded-lg mb-3`} />
              <div className={`h-10 w-full ${shimmerBlock} rounded-lg`} />
            </div>
          ))}

          {/* Your Details card — 2×2 small label/value grid */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]">
            <div className="flex justify-between items-center mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
              <div className={`h-[10px] w-20 ${shimmerBlock} rounded`} />
              <div className={`h-[10px] w-10 ${shimmerBlock} rounded`} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-[clamp(0.5rem,1.4dvh,0.75rem)]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className={`h-[10px] w-16 ${shimmerBlock} rounded`} />
                  <div className={`h-[14px] w-20 ${shimmerBlock} rounded-lg`} />
                </div>
              ))}
            </div>
          </div>

          {/* Subscription card */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]">
            <div className={`h-[10px] w-20 ${shimmerBlock} rounded mb-[clamp(0.5rem,1.4dvh,0.75rem)]`} />
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <div className={`h-[18px] w-32 ${shimmerBlock} rounded-lg mb-2`} />
                <div className={`h-[12px] w-28 ${shimmerBlock} rounded-lg mb-1.5`} />
                <div className={`h-[12px] w-36 ${shimmerBlock} rounded-lg`} />
              </div>
              <div className={`h-[22px] w-14 ${shimmerBlock} rounded-full shrink-0`} />
            </div>
            <div className={`h-[44px] w-full ${shimmerBlock} rounded-full mb-2`} />
            <div className={`h-[44px] w-full ${shimmerBlock} rounded-full`} />
          </div>

          {/* Danger zone (col-span-2) */}
          <div className="flex flex-col gap-3 pt-[clamp(0.3rem,0.8dvh,0.5rem)] md:col-span-2">
            <div className={`h-[52px] w-full ${shimmerBlock} rounded-[24px]`} />
            <div className={`h-[52px] w-full ${shimmerBlock} rounded-[24px]`} />
          </div>
        </div>

        {/* Reset section */}
        <div className="mt-[clamp(1rem,2.6dvh,1.4rem)] md:col-span-2">
          <div className={`h-[14px] w-28 ${shimmerBlock} rounded mx-auto`} />
        </div>
      </div>
    </div>
  );
}

export function MealLoggerSkeleton() {
  return (
    <div
      className="screen-container screen-enter"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Header: title + subtitle on left; prev/date/next controls on right */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <div className={`h-[28px] w-32 ${shimmerBlock} rounded-lg mb-1`} />
          <div className={`h-[14px] w-20 ${shimmerBlock} rounded-lg`} />
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-[44px] h-[44px] rounded-full ${shimmerBlock}`} />
          <div className={`h-[18px] w-[85px] ${shimmerBlock} rounded-lg`} />
          <div className={`w-[44px] h-[44px] rounded-full ${shimmerBlock}`} />
        </div>
      </div>

      {/* Daily Summary card — matches real page's rounded-[24px] p-5 summary */}
      <div className="mb-6 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div className={`h-[12px] w-24 ${shimmerBlock} rounded`} />
          <div className={`h-[16px] w-32 ${shimmerBlock} rounded-lg`} />
        </div>

        {/* Calorie bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-1.5 items-end">
            <div className={`h-[13px] w-16 ${shimmerBlock} rounded`} />
            <div className={`h-[14px] w-24 ${shimmerBlock} rounded`} />
          </div>
          <div className={`h-2 w-full rounded-full ${shimmerBlock}`} />
        </div>

        {/* Protein bar */}
        <div>
          <div className="flex justify-between mb-1.5 items-end">
            <div className={`h-[13px] w-16 ${shimmerBlock} rounded`} />
            <div className={`h-[14px] w-24 ${shimmerBlock} rounded`} />
          </div>
          <div className={`h-2 w-full rounded-full ${shimmerBlock}`} />
        </div>

        {/* 4-macro row */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`h-[16px] w-10 ${shimmerBlock} rounded`} />
              <div className={`h-[10px] w-10 ${shimmerBlock} rounded`} />
            </div>
          ))}
        </div>
      </div>

      {/* Meal Log header row + credits pill */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className={`h-[12px] w-20 ${shimmerBlock} rounded`} />
        <div className={`h-[22px] w-16 ${shimmerBlock} rounded-full`} />
      </div>

      {/* 4 slot rows (breakfast / lunch / dinner / snack) */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="mb-4 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-[16px] ${shimmerBlock}`} />
            <div className="flex flex-col gap-1.5">
              <div className={`h-[17px] w-20 ${shimmerBlock} rounded-lg`} />
              <div className={`h-[13px] w-24 ${shimmerBlock} rounded-lg`} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end gap-1.5">
              <div className={`h-[16px] w-20 ${shimmerBlock} rounded`} />
              <div className={`h-[13px] w-16 ${shimmerBlock} rounded`} />
            </div>
            <div className={`h-5 w-5 ${shimmerBlock} rounded`} />
          </div>
        </div>
      ))}

      {/* FAB placeholder — uses the same positioning classes as the real page,
          so its location matches 1:1 (centre on mobile, right on tablet, right
          within 720px column on desktop). */}
      <div className="meal-fab-positioner" aria-hidden="true">
        <div className="meal-fab-container">
          <div className={`w-14 h-14 rounded-full ${shimmerBlock}`} />
        </div>
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="page-enter px-5 py-4 min-h-[100dvh] bg-[#0A0A0A] pb-[calc(100px+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+20px)]">
      {/* Page header */}
      <div className="mb-6 mt-2">
        <div className={`h-[22px] w-32 ${shimmerBlock} rounded-lg mb-1`} />
        <div className={`h-[13px] w-56 ${shimmerBlock} rounded-lg`} />
      </div>

      {/* Morning Weight card — matches `card-base p-4 mb-6` */}
      <div className="card-base p-4 mb-6">
        <div className={`h-[13px] w-28 ${shimmerBlock} rounded-lg mb-3`} />
        <div className="flex gap-2">
          <div className={`h-[44px] flex-1 ${shimmerBlock} rounded-[16px]`} />
          <div className={`h-[44px] w-24 ${shimmerBlock} rounded-full`} />
        </div>
      </div>

      {/* Weight Trend card — matches `card-base p-4 mb-6` with chart at 220px */}
      <div className="card-base p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className={`h-[13px] w-24 ${shimmerBlock} rounded-lg`} />
          <div className={`h-[22px] w-20 ${shimmerBlock} rounded-full`} />
        </div>
        <div className={`h-[220px] w-full ${shimmerBlock} rounded-xl`} />
      </div>

      {/* Milestone Roadmap card — matches `card-base p-5 mb-10` with 4 milestone rows */}
      <div className="card-base p-5 mb-10">
        <div className={`h-[13px] w-36 ${shimmerBlock} rounded-lg mb-6`} />
        <div className="flex flex-col">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-3">
              <div className="flex flex-col gap-1.5">
                <div className={`h-[14px] w-16 ${shimmerBlock} rounded-lg`} />
                <div className={`h-[13px] w-20 ${shimmerBlock} rounded-lg`} />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className={`h-[13px] w-24 ${shimmerBlock} rounded-lg`} />
                <div className={`h-[11px] w-16 ${shimmerBlock} rounded-lg`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NutritionDetailSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      {/* Header: back w-[44px] + title + w-8 spacer (matches both calorie & protein pages) */}
      <div className="flex items-center justify-between pt-4 pb-3 mb-5">
        <div className={`w-[44px] h-[44px] rounded-full ${shimmerBlock}`} />
        <div className={`h-[17px] w-20 ${shimmerBlock} rounded-lg`} />
        <div className="w-8" />
      </div>

      {/* Hero: 40px number + "of X" + 2px progress bar */}
      <div className="flex flex-col items-center justify-center text-center mb-4">
        <div className={`h-[40px] w-24 ${shimmerBlock} rounded-lg mb-2`} />
        <div className={`h-[13px] w-28 ${shimmerBlock} rounded mb-8`} />
        <div className={`w-full max-w-[280px] h-2 rounded-full ${shimmerBlock}`} />
      </div>

      {/* Daily history chart card — mirrors the real outer card + inner glass-card
          chart (nav row + target + 156px bars + legend). */}
      <div className="rounded-[20px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-4 mb-5">
        <div className={`h-[12px] w-32 ${shimmerBlock} rounded mb-2`} />
        <div className="rounded-[16px] p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className={`w-8 h-8 rounded-lg ${shimmerBlock}`} />
            <div className={`h-[18px] w-24 ${shimmerBlock} rounded-lg`} />
            <div className={`w-8 h-8 rounded-lg ${shimmerBlock}`} />
          </div>
          <div className="flex justify-end mb-6">
            <div className={`h-[12px] w-32 ${shimmerBlock} rounded`} />
          </div>
          <div className={`h-[156px] w-full ${shimmerBlock} rounded-xl mb-4`} />
          <div className="flex flex-wrap gap-4">
            <div className={`h-[10px] w-20 ${shimmerBlock} rounded`} />
            <div className={`h-[10px] w-20 ${shimmerBlock} rounded`} />
            <div className={`h-[10px] w-24 ${shimmerBlock} rounded`} />
          </div>
        </div>
      </div>

      {/* Today's Meals — 12px label + slot cards (header row + item rows) */}
      <div>
        <div className={`h-[12px] w-24 ${shimmerBlock} rounded mb-4 px-1`} />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] mb-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
              <div className={`h-[16px] w-24 ${shimmerBlock} rounded-lg`} />
              <div className={`h-[15px] w-20 ${shimmerBlock} rounded-lg`} />
            </div>
            <div className="px-5 py-2">
              {[1, 2].map((j) => (
                <div
                  key={j}
                  className={`flex items-center justify-between py-3.5 ${
                    j < 2 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''
                  }`}
                >
                  <div className={`h-[15px] w-40 ${shimmerBlock} rounded`} />
                  <div className={`h-[26px] w-20 ${shimmerBlock} rounded-full`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProteinDetailSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-3 mb-5">
        <div className={`w-[44px] h-[44px] rounded-full ${shimmerBlock}`} />
        <div className={`h-[17px] w-20 ${shimmerBlock} rounded-lg`} />
        <div className="w-8" />
      </div>

      {/* Macro switcher (protein / fat / carbs) — only present on /protein */}
      <div className="flex items-center gap-1 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] p-1 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-9 flex-1 rounded-full ${shimmerBlock}`} />
        ))}
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center mb-4">
        <div className={`h-[40px] w-24 ${shimmerBlock} rounded-lg mb-2`} />
        <div className={`h-[13px] w-28 ${shimmerBlock} rounded mb-8`} />
        <div className={`w-full max-w-[280px] h-2 rounded-full ${shimmerBlock}`} />
      </div>

      {/* Daily history chart card */}
      <div className="rounded-[20px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-4 mb-5">
        <div className={`h-[12px] w-32 ${shimmerBlock} rounded mb-2`} />
        <div className="rounded-[16px] p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className={`w-8 h-8 rounded-lg ${shimmerBlock}`} />
            <div className={`h-[18px] w-24 ${shimmerBlock} rounded-lg`} />
            <div className={`w-8 h-8 rounded-lg ${shimmerBlock}`} />
          </div>
          <div className="flex justify-end mb-6">
            <div className={`h-[12px] w-32 ${shimmerBlock} rounded`} />
          </div>
          <div className={`h-[156px] w-full ${shimmerBlock} rounded-xl mb-4`} />
          <div className="flex flex-wrap gap-4">
            <div className={`h-[10px] w-20 ${shimmerBlock} rounded`} />
            <div className={`h-[10px] w-20 ${shimmerBlock} rounded`} />
            <div className={`h-[10px] w-24 ${shimmerBlock} rounded`} />
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div>
        <div className={`h-[12px] w-24 ${shimmerBlock} rounded mb-4 px-1`} />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] mb-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
              <div className={`h-[16px] w-24 ${shimmerBlock} rounded-lg`} />
              <div className={`h-[15px] w-20 ${shimmerBlock} rounded-lg`} />
            </div>
            <div className="px-5 py-2">
              {[1, 2].map((j) => (
                <div
                  key={j}
                  className={`flex items-center justify-between py-3.5 ${
                    j < 2 ? 'border-b border-[rgba(255,255,255,0.06)]' : ''
                  }`}
                >
                  <div className={`h-[15px] w-40 ${shimmerBlock} rounded`} />
                  <div className={`h-[26px] w-20 ${shimmerBlock} rounded-full`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoalSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex items-center justify-between mb-8">
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none" />
        <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
        <div className="w-8" />
      </div>
      
      <div className="mb-6 flex gap-2">
         <div className="h-2 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
         <div className="h-2 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
         <div className="h-2 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
         <div className="h-2 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
      </div>

      <div className="flex flex-col items-center mt-12 mb-10">
         <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none mb-6" />
         <div className="h-8 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-3" />
         <div className="h-4 w-64 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-auto">
         <div className="h-[200px] w-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-[24px]" />
         <div className="h-[200px] w-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-[24px]" />
      </div>
    </div>
  );
}
