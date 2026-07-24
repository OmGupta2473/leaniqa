import React from 'react';
import { cn } from '@/shared/utils/utils';

export function DashboardSkeleton() {
  return (
    <div className="page-enter px-4 pb-[calc(80px+env(safe-area-inset-bottom))] pt-6 space-y-4 min-h-[100dvh] bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-8 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-2" />
          <div className="h-4 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
        </div>
        <div className="h-8 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
      </div>

      {/* AI Insight Card */}
      <div className="rounded-[20px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-3">
          <div className="h-3 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
          <div className="h-4 w-4 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
          <div className="h-4 w-4/5 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Calories Hero */}
      <div className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-5">
          <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
        </div>
        <div className="h-12 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-6" />
        <div className="flex items-center gap-6">
          <div className="w-[100px] h-[100px] rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-8 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
            <div className="h-4 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
          </div>
        </div>
      </div>

      {/* Macronutrients */}
      <div className="rounded-[24px] p-6 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between items-center mb-7">
          <div className="h-3 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
        </div>
        <div className="flex flex-col gap-7">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[12px] bg-[rgba(255,255,255,0.05)] animate-pulse" />
                  <div className="h-4 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
                </div>
                <div className="h-4 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Weight Progress & Next Meal Row */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="rounded-[24px] p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
            </div>
            <div>
              <div className="h-8 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-2" />
              <div className="h-3 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
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
        <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
        <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
        <div className="h-6 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
      </div>
      
      <div className="rounded-[32px] p-8 flex flex-col items-center justify-center mb-10 border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] h-[300px]">
        <div className="w-[120px] h-[120px] rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse mb-6" />
        <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-2" />
        <div className="h-4 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="h-6 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 flex flex-col items-center h-[200px]">
             <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse mb-4" />
             <div className="h-4 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-2" />
             <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyReportSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex items-center justify-between mb-8">
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
        <div className="h-5 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
      </div>

      <div className="mb-6">
        <div className="h-10 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-2" />
        <div className="h-4 w-64 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
      </div>

      <div className="card-base p-6 mb-8 flex items-center justify-between h-[120px]">
         <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
            <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
         </div>
         <div className="w-[80px] h-[80px] rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
      </div>

      <div className="h-4 w-40 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-4" />
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-base p-5 h-[110px] flex flex-col justify-between">
            <div className="h-4 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
            <div className="h-8 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex justify-between items-center mb-10">
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
        <div className="h-5 w-20 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
        <div className="w-8" />
      </div>

      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse mb-4" />
        <div className="h-6 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-2" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
          <div className="h-6 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
         {[1, 2, 3].map(i => (
            <div key={i} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-4 flex flex-col items-center h-[90px] justify-center gap-2">
               <div className="h-6 w-12 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
               <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
            </div>
         ))}
      </div>

      <div className="space-y-4">
         {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] animate-pulse rounded-[16px]" />
         ))}
      </div>
    </div>
  );
}

export function MealLoggerSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex items-center justify-between mb-8">
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
        <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
        <div className="w-8" />
      </div>

      <div className="mb-6 flex gap-2">
        <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
        <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
        <div className="h-10 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card-base p-5 h-[100px] flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
               <div className="h-5 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
               <div className="h-5 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
            </div>
            <div className="h-4 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
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
        <div className="h-6 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-2" />
        <div className="h-4 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
      </div>

      <div className="card-base p-4 mb-6">
        <div className="h-4 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-3" />
        <div className="flex gap-2">
           <div className="h-12 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-[16px]" />
           <div className="h-12 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-[16px]" />
        </div>
      </div>

      <div className="h-[250px] w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] animate-pulse rounded-[24px] mb-6" />

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-base p-5 h-[120px] flex flex-col justify-between">
             <div className="h-4 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
             <div className="h-8 w-16 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
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
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
        <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
        <div className="w-8" />
      </div>

      <div className="flex flex-col items-center justify-center mb-12 mt-6">
         <div className="h-16 w-32 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-2" />
         <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-8" />
         <div className="h-2 w-full max-w-[280px] bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
      </div>

      <div className="h-[250px] w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] animate-pulse rounded-[24px] mb-10" />

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
           <div key={i} className="h-[120px] w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] animate-pulse rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}

export function GoalSkeleton() {
  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex items-center justify-between mb-8">
        <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
        <div className="h-5 w-24 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
        <div className="w-8" />
      </div>
      
      <div className="mb-6 flex gap-2">
         <div className="h-2 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
         <div className="h-2 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
         <div className="h-2 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
         <div className="h-2 flex-1 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-full" />
      </div>

      <div className="flex flex-col items-center mt-12 mb-10">
         <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse mb-6" />
         <div className="h-8 w-48 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg mb-3" />
         <div className="h-4 w-64 bg-[rgba(255,255,255,0.05)] animate-pulse rounded-lg" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-auto">
         <div className="h-[200px] w-full bg-[rgba(255,255,255,0.05)] animate-pulse rounded-[24px]" />
         <div className="h-[200px] w-full bg-[rgba(255,255,255,0.05)] animate-pulse rounded-[24px]" />
      </div>
    </div>
  );
}
