import React from 'react';
import { cn } from '@/shared/utils/utils';

export function DashboardSkeleton() {
  return (
    <div className="page-enter px-4 pb-[calc(80px+env(safe-area-inset-bottom))] pt-6 space-y-4 min-h-[100dvh] bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-8 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-2" />
          <div className="h-4 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
        </div>
        <div className="h-8 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
      </div>

      {/* AI Insight Card */}
      <div className="rounded-[20px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-3">
          <div className="h-3 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
          <div className="h-4 w-4 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
          <div className="h-4 w-4/5 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
        </div>
      </div>

      {/* Calories Hero */}
      <div className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-5">
          <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
        </div>
        <div className="h-12 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-6" />
        <div className="flex items-center gap-6">
          <div className="w-[100px] h-[100px] rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-8 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
            <div className="h-4 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
          </div>
        </div>
      </div>

      {/* Macronutrients */}
      <div className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-7">
          <div className="h-3 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
        </div>
        <div className="flex flex-col gap-7">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none" />
                  <div className="h-4 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
                </div>
                <div className="h-4 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Weight Progress & Next Meal Row */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="rounded-[24px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
            </div>
            <div>
              <div className="h-8 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-2" />
              <div className="h-3 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AwardsSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#000000] px-5">
      <div className="flex items-center justify-between mb-10">
        <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none" />
        <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
        <div className="h-6 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
      </div>
      
      <div className="rounded-[32px] p-8 flex flex-col items-center justify-center mb-10 border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] h-[300px]">
        <div className="w-[120px] h-[120px] rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none mb-6" />
        <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-2" />
        <div className="h-4 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="h-6 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 flex flex-col items-center h-[200px]">
             <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none mb-4" />
             <div className="h-4 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-2" />
             <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyReportSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-4 md:px-8">
      {/* Header Skeleton */}
      <header className="relative mb-8 md:mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-6 w-24 bg-white/5 animate-pulse rounded-lg hidden sm:block" />
        </div>

        <div className="absolute left-1/2 top-0 -translate-x-1/2 hidden md:block">
          <div className="w-24 h-8 rounded-full bg-white/5 animate-pulse" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto md:justify-end">
          <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/5 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Mobile badge skeleton */}
      <div className="md:hidden mb-6 text-center">
        <div className="w-24 h-8 mx-auto rounded-full bg-white/5 animate-pulse" />
      </div>

      {/* Week Selector Skeleton */}
      <div className="mb-8">
        <div className="w-48 h-10 mx-auto rounded-full bg-white/5 animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Week Label Skeleton */}
        <div className="mb-8 text-center">
          <div className="w-40 h-8 mx-auto rounded-full bg-white/5 animate-pulse" />
        </div>

        {/* Weekly Consistency Card Skeleton */}
        <div className="mb-8 rounded-[24px] border border-white/5 bg-white/[0.03] p-6 md:p-8 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex flex-col items-center md:w-48 md:h-48 md:shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5" />
              <div className="absolute -top-10 -left-10 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 flex-1">
              <div className="text-center md:text-left">
                <div className="h-5 w-32 bg-white/5 animate-pulse rounded mb-2 mx-auto md:mx-0" />
                <div className="h-4 w-40 bg-white/5 animate-pulse rounded mx-auto md:mx-0" />
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 mt-4 md:mt-0">
                <div className="w-24 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="w-28 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="w-28 h-8 rounded-full bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart Card Skeleton */}
        <div className="mb-8 rounded-[24px] border border-white/5 bg-white/[0.03] p-6 md:p-8 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="h-5 w-24 bg-white/5 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="w-16 h-8 rounded-full bg-white/5 animate-pulse" />
              <div className="w-20 h-8 rounded-full bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="h-[300px] md:h-[350px] mb-6 bg-white/5 animate-pulse rounded-lg" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/5 animate-pulse" />
                <div className="w-12 h-4 bg-white/5 animate-pulse rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-white/5 animate-pulse rounded" />
                <div className="w-10 h-4 bg-white/5 animate-pulse rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-8 rounded-full bg-white/5 animate-pulse" />
              <div className="w-20 h-8 rounded-full bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Items Skeleton */}
        <div className="mb-8">
          <div className="h-4 w-20 bg-white/5 animate-pulse rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[16px] border border-white/5 bg-white/[0.03] p-4 md:p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-white/5 animate-pulse" />
                  <div className="h-5 w-full bg-white/5 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day Timeline Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="rounded-[16px] border border-white/5 bg-white/[0.03] p-4 md:p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-20 bg-white/5 animate-pulse rounded" />
                <div className="h-6 w-16 bg-white/5 animate-pulse rounded-full" />
              </div>
              <div className="h-3 w-full bg-white/5 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex justify-between items-center mb-10">
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none" />
        <div className="h-5 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
        <div className="w-8" />
      </div>

      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none mb-4" />
        <div className="h-6 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-2" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
          <div className="h-6 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
         {[1, 2, 3].map(i => (
            <div key={i} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-4 flex flex-col items-center h-[90px] justify-center gap-2">
               <div className="h-6 w-12 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
               <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
            </div>
         ))}
      </div>

      <div className="space-y-4">
         {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-[16px]" />
         ))}
      </div>
    </div>
  );
}

export function MealLoggerSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex items-center justify-between mb-8">
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none" />
        <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
        <div className="w-8" />
      </div>

      <div className="mb-6 flex gap-2">
        <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
        <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
        <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card-base p-5 h-[100px] flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
               <div className="h-5 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
               <div className="h-5 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
            </div>
            <div className="h-4 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="page-enter px-5 py-4 min-h-[100dvh] bg-[#0A0A0A] pb-[calc(100px+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+20px)]">
      <div className="mb-6 mt-2">
        <div className="h-6 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-2" />
        <div className="h-4 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
      </div>

      <div className="card-base p-4 mb-6">
        <div className="h-4 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-3" />
        <div className="flex gap-2">
           <div className="h-12 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-[16px]" />
           <div className="h-12 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-[16px]" />
        </div>
      </div>

      <div className="h-[250px] w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-[24px] mb-6" />

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-base p-5 h-[120px] flex flex-col justify-between">
             <div className="h-4 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
             <div className="h-8 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NutritionDetailSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex items-center justify-between mb-10">
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none" />
        <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg" />
        <div className="w-8" />
      </div>

      <div className="flex flex-col items-center justify-center mb-12 mt-6">
         <div className="h-16 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-2" />
         <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-lg mb-8" />
         <div className="h-2 w-full max-w-[280px] bg-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-full" />
      </div>

      <div className="h-[250px] w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-[24px] mb-10" />

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
           <div key={i} className="h-[120px] w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] animate-pulse motion-reduce:animate-none rounded-[24px]" />
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
