import React from 'react';
import { motion } from 'motion/react';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { ArrowRight, Clock, Target, Zap } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { useNavigate } from 'react-router-dom';

function displayVal(val: any) {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'number') {
    if (isNaN(val)) return '—';
    return Number.isInteger(val) ? val : parseFloat(val.toFixed(1));
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== '') {
      return Number.isInteger(num) ? num : parseFloat(num.toFixed(1));
    }
  }
  return val;
}

import { maleOptions, femaleOptions } from '@/shared/constants/bodyFatOptions';

function BodyFatImagePlaceholder({ gender, categoryRange, className }: { gender: string, categoryRange: string, className?: string }) {
  return (
    <div className={cn("w-full h-full bg-[rgba(255,255,255,0.02)] flex flex-col items-center justify-center border border-[rgba(255,255,255,0.05)] relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.01)] to-transparent pointer-events-none" />
      <div className="w-12 h-12 rounded-full border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-3 bg-[rgba(0,0,0,0.2)]">
        <svg className="w-5 h-5 text-[rgba(255,255,255,0.2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="text-[11px] uppercase tracking-widest text-[rgba(255,255,255,0.3)] font-medium mb-1">{gender}</div>
      <div className="text-[14px] font-bold text-[rgba(255,255,255,0.5)]">{categoryRange}</div>
    </div>
  );
}

export function TransformationSection() {
  const navigate = useNavigate();
  const { profileData, isLoading } = useCalculatedProfile();

  if (isLoading || !profileData || !profileData.currentBodyFatPct || !profileData.targetBodyFatPct) {
    return null;
  }

  const { gender = 'Male', currentBodyFatPct, targetBodyFatPct, estimatedWeeks, estimatedCompletionDate, dailyCalorieGoal, proteinMin, proteinMax, fatToLoseKg, targetWeightKg, chosenStrategyName, dailyDeficit } = profileData;

  const bfOptions = (gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f') ? femaleOptions : maleOptions;
  
  // Find current image
  let currentIdx = bfOptions.findIndex(o => o.mid === currentBodyFatPct);
  if (currentIdx === -1) {
    // find closest
    let minDiff = Infinity;
    for (let i = 0; i < bfOptions.length; i++) {
      const diff = Math.abs(bfOptions[i].mid - currentBodyFatPct);
      if (diff < minDiff) {
        minDiff = diff;
        currentIdx = i;
      }
    }
  }

  // Find target image
  let targetIdx = bfOptions.findIndex(o => o.mid === targetBodyFatPct);
  if (targetIdx === -1) {
    let minDiff = Infinity;
    for (let i = 0; i < bfOptions.length; i++) {
      const diff = Math.abs(bfOptions[i].mid - targetBodyFatPct);
      if (diff < minDiff) {
        minDiff = diff;
        targetIdx = i;
      }
    }
  }

  const getImgSrc = (idx: number) => {
    const p = idx + 1;
    return `/${gender.toLowerCase()}_physique_${p === 8 ? 7 : p}.png`;
  };

  const currentImg = getImgSrc(currentIdx);
  const targetImg = getImgSrc(targetIdx);
  const currentOpt = bfOptions[currentIdx];
  const targetOpt = bfOptions[targetIdx];
  
  const isMale = gender.toLowerCase() === 'male' || gender.toLowerCase() === 'm';

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(55,138,221,0.1)] border-[0.5px] border-[rgba(55,138,221,0.2)] flex items-center justify-center">
            <span className="text-[#378ADD] font-extrabold text-[16px]">2</span>
          </div>
          <div>
            <h3 className="text-[22px] font-semibold tracking-tight text-white leading-tight">Body Goal</h3>
            <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Target physique & strategy</div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/goal')} 
          className="bg-[rgba(55,138,221,0.12)] border-[0.5px] border-[rgba(55,138,221,0.3)] rounded-lg text-[#378ADD] font-semibold transition-all active:scale-95"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Update
        </button>
      </div>

      <div className="bg-[#111113] border border-[rgba(255,255,255,0.06)] rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4FF00] rounded-full blur-[120px] opacity-[0.03] pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#378ADD] rounded-full blur-[120px] opacity-[0.03] pointer-events-none transform -translate-x-1/2 translate-y-1/2" />

        <div className="flex flex-row items-center justify-between gap-3 mb-6 relative z-10">
          {/* Current */}
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[12px] font-semibold text-[rgba(235,235,245,0.5)] uppercase tracking-widest mb-3">Current</div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="w-full aspect-[3/4] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-zinc-900 relative shadow-lg"
            >
              {isMale ? (
                <img src={currentImg} alt="Current Physique" className="w-full h-full object-cover" />
              ) : (
                <BodyFatImagePlaceholder gender={gender} categoryRange={currentOpt.range} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-[18px] font-bold text-white shadow-sm">{currentOpt.range}</span>
              </div>
            </motion.div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center shrink-0 px-2 mt-8">
            <motion.div 
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.1)] backdrop-blur-md"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Target */}
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[12px] font-semibold text-[#D4FF00] uppercase tracking-widest mb-3 opacity-90">Target</div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="w-full aspect-[3/4] rounded-2xl overflow-hidden border border-[#D4FF00] bg-zinc-900 relative shadow-[0_0_30px_rgba(212,255,0,0.1)]"
            >
              {isMale ? (
                <img src={targetImg} alt="Target Physique" className="w-full h-full object-cover" />
              ) : (
                <BodyFatImagePlaceholder gender={gender} categoryRange={targetOpt.range} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[rgba(17,17,19,0.3)] to-transparent opacity-90" />
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-[18px] font-bold text-[#D4FF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{targetOpt.range}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info Block */}
        <div className="bg-[rgba(0,0,0,0.3)] rounded-2xl p-4 border border-[rgba(255,255,255,0.03)] relative z-10 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div className="flex flex-col">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Fat to lose</span>
              <span className="text-[16px] font-bold text-white">{displayVal(fatToLoseKg)} kg</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Target weight</span>
              <span className="text-[16px] font-bold text-white">{displayVal(targetWeightKg)} kg</span>
            </div>
            <div className="col-span-2 w-full h-[1px] bg-[rgba(255,255,255,0.06)] my-1" />
            <div className="flex flex-col">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Strategy</span>
              <span className="text-[15px] font-bold text-[#D4FF00]">{displayVal(chosenStrategyName)}</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Daily deficit</span>
              <span className="text-[15px] font-bold text-white">{displayVal(dailyDeficit)} kcal</span>
            </div>
            <div className="col-span-2 w-full h-[1px] bg-[rgba(255,255,255,0.06)] my-1" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[rgba(235,235,245,0.7)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Estimated Time</span>
                <span className="text-[15px] font-bold text-white tracking-tight">{estimatedWeeks ? `${estimatedWeeks} weeks` : '—'}</span>
                {estimatedCompletionDate && (
                  <span className="text-[11px] text-[rgba(235,235,245,0.4)] mt-0.5">{estimatedCompletionDate}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <div className="flex flex-col items-end text-right">
                <span className="text-[12px] text-[rgba(235,235,245,0.5)] font-medium mb-0.5">Daily Goal</span>
                <span className="text-[15px] font-bold text-[#D4FF00] tracking-tight">{dailyCalorieGoal ? `${dailyCalorieGoal} kcal` : '—'}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[rgba(212,255,0,0.05)] flex items-center justify-center shrink-0 border border-[rgba(212,255,0,0.1)]">
                <Target className="w-5 h-5 text-[#D4FF00]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
