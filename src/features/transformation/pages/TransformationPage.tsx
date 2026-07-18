import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/features/profile/services/profileService";
import { ChevronLeft, TrendingDown, TrendingUp, Target, Bolt, Flame, Minus, Calendar, Flag } from "lucide-react";
import { useCalculatedProfile } from "@/shared/hooks/useCalculatedProfile";

function displayVal(val: any) {
  return val === undefined || val === null || isNaN(val) ? '—' : val;
}

export function TransformationPage() {
  const navigate = useNavigate();

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ["goal"], queryFn: () => profileService.getGoal() });

  const { profileData: calculated } = useCalculatedProfile();

  const {
    weightKg, currentBodyFatPct, targetBodyFatPct,
    fatToLoseKg, targetWeightKg, chosenStrategyName, dailyCalorieGoal, dailyDeficit, estimatedWeeks, estimatedCompletionDate
  } = calculated;

  let completionDateStr = "—";
  if (estimatedCompletionDate) {
    const d = new Date(estimatedCompletionDate);
    if (!isNaN(d.getTime())) {
      completionDateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } else {
      completionDateStr = estimatedCompletionDate as string;
    }
  }

  // Determine change direction
  const isDecreasing = (fatToLoseKg && fatToLoseKg > 0) || (targetBodyFatPct && currentBodyFatPct && targetBodyFatPct < currentBodyFatPct);

  return (
    <div className="page-enter min-h-[100dvh] bg-[#0A0A0A] pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] px-5">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="text-[17px] font-semibold text-white tracking-tight">Transformation Plan</div>
        <div className="w-8" />
      </div>

      {/* Hero Projection Card */}
      <div className="bg-[rgba(212,255,0,0.03)] border border-[rgba(212,255,0,0.15)] rounded-3xl p-6 flex flex-col items-center justify-center text-center mb-10">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4FF00] mb-2 opacity-80">
          Projected weight
        </div>
        
        <div className="text-[48px] font-bold text-white tracking-[-1.5px] leading-none mb-3">
          {displayVal(targetWeightKg)}<span className="text-[24px] text-[rgba(255,255,255,0.5)] font-medium ml-1">kg</span>
        </div>
        
        {fatToLoseKg && fatToLoseKg > 0 ? (
          <div className="bg-[rgba(212,255,0,0.1)] text-[#D4FF00] rounded-full px-3 py-1 text-[12px] font-semibold flex items-center gap-1">
            <TrendingDown size={14} className="animate-pulse" />
            {displayVal(fatToLoseKg)} kg to lose
          </div>
        ) : (
          <div className="bg-[rgba(255,77,28,0.1)] text-[#FF4D1C] rounded-full px-3 py-1 text-[12px] font-semibold flex items-center gap-1">
            <TrendingUp size={14} className="animate-pulse" />
            {displayVal(Math.abs(fatToLoseKg || 0))} kg to gain
          </div>
        )}
        
        <div className="text-[12px] text-[rgba(255,255,255,0.45)] mt-4 max-w-[240px]">
          Based on 80% program compliance and your selected strategy.
        </div>
      </div>

      {/* BF% Progression / Milestone Pattern */}
      <div className="card-base p-5 mb-10">
        <div className="text-[13px] font-semibold text-white mb-6">Physique Timeline</div>
        
        <div className="flex flex-col relative pb-2">
          <div className="absolute left-[18px] top-[8px] bottom-[24px] w-[1px] bg-[rgba(255,255,255,0.1)]"></div>
          
          <div className="flex justify-between items-center py-3 relative z-10 pl-[42px]">
            <div className="absolute left-[14px] w-[9px] h-[9px] rounded-full top-1/2 -translate-y-1/2 bg-[#D4FF00] shadow-[0_0_8px_rgba(212,255,0,0.5)]"></div>
            <div className="flex flex-col">
              <span className="text-[14px] font-medium text-white tracking-tight">Starting Point</span>
              <span className="text-[13px] text-[rgba(235,235,245,0.5)] mt-0.5">{displayVal(currentBodyFatPct)}% BF</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[13px] font-medium text-white tracking-tight">{displayVal(weightKg)} kg</span>
              <span className="text-[11px] text-[#D4FF00] mt-0.5 font-medium">Now</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-3 relative z-10 pl-[42px]">
            <div className="absolute left-[14px] w-[9px] h-[9px] rounded-full top-1/2 -translate-y-1/2 border-[1.5px] border-[rgba(255,255,255,0.2)] bg-[#111113]"></div>
            <div className="flex flex-col">
              <span className="text-[14px] font-medium text-white tracking-tight">Target Goal</span>
              <span className="text-[13px] text-[rgba(235,235,245,0.5)] mt-0.5">{displayVal(targetBodyFatPct)}% BF</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[13px] font-medium text-white tracking-tight">{displayVal(targetWeightKg)} kg</span>
              <span className="text-[11px] text-[rgba(255,255,255,0.4)] mt-0.5">in {displayVal(estimatedWeeks)} wks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projection details cards */}
      <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight mb-4">Transformation Goals</div>
      <div className="grid grid-cols-2 gap-3 mb-10">
        
        <div className="card-base p-[14px] flex flex-col">
          <div className="w-10 h-10 rounded-[20px] bg-[rgba(212,255,0,0.08)] flex items-center justify-center mb-3">
            <Target size={20} className="text-[#D4FF00]" />
          </div>
          <div className="text-[14px] font-medium text-white">{displayVal(targetWeightKg)} kg</div>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Target weight</div>
        </div>

        <div className="card-base p-[14px] flex flex-col">
          <div className="w-10 h-10 rounded-[20px] bg-[rgba(255,77,28,0.08)] flex items-center justify-center mb-3">
            <TrendingDown size={20} className="text-[#FF4D1C]" />
          </div>
          <div className="text-[14px] font-medium text-white">{displayVal(fatToLoseKg)} kg</div>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Fat to lose</div>
        </div>

        <div className="card-base p-[14px] flex flex-col">
          <div className="w-10 h-10 rounded-[20px] bg-[rgba(55,138,221,0.08)] flex items-center justify-center mb-3">
            <Bolt size={20} className="text-[#378ADD]" />
          </div>
          <div className="text-[14px] font-medium text-[#378ADD] leading-tight">{displayVal(chosenStrategyName)}</div>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)] mt-auto pt-1">Strategy</div>
        </div>

        <div className="card-base p-[14px] flex flex-col">
          <div className="w-10 h-10 rounded-[20px] bg-[rgba(212,255,0,0.08)] flex items-center justify-center mb-3">
            <Flame size={20} className="text-[#D4FF00]" />
          </div>
          <div className="text-[14px] font-medium text-white">{displayVal(dailyCalorieGoal)} kcal</div>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Daily target</div>
        </div>

        <div className="card-base p-[14px] flex flex-col">
          <div className="w-10 h-10 rounded-[20px] bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
            <Minus size={20} className="text-white" />
          </div>
          <div className="text-[14px] font-medium text-white">{displayVal(dailyDeficit)} kcal</div>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Daily deficit</div>
        </div>

        <div className="card-base p-[14px] flex flex-col">
          <div className="w-10 h-10 rounded-[20px] bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
            <Calendar size={20} className="text-white" />
          </div>
          <div className="text-[14px] font-medium text-white">{displayVal(estimatedWeeks)} weeks</div>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Estimated time</div>
        </div>

        <div className="card-base p-[14px] flex flex-col col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[20px] bg-[rgba(255,255,255,0.03)] flex items-center justify-center shrink-0">
              <Flag size={20} className="text-white" />
            </div>
            <div>
              <div className="text-[14px] font-medium text-white">{completionDateStr}</div>
              <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Estimated target date</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
