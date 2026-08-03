import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { profileService } from '../services/profileService';
import { calculateMacros, calculateGoalStats } from '@/shared/utils/profileCalculations';
import { haptics } from '@/shared/utils/haptics';
import { cn } from '@/shared/utils/utils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
  goalData: any;
}

export function EditProfileModal({ isOpen, onClose, profileData, goalData }: EditProfileModalProps) {
  const queryClient = useQueryClient();

  const [weight, setWeight] = useState(String(profileData?.weight || ''));
  const [height, setHeight] = useState(String(profileData?.height || ''));
  const [currentBf, setCurrentBf] = useState(String(goalData?.current_bf || ''));
  const [targetBf, setTargetBf] = useState(String(goalData?.target_bf || ''));
  const [activity, setActivity] = useState(profileData?.activity_level || 'Sedentary');

  useEffect(() => {
    if (isOpen) {
      setWeight(String(profileData?.weight || ''));
      setHeight(String(profileData?.height || ''));
      setCurrentBf(String(goalData?.current_bf || ''));
      setTargetBf(String(goalData?.target_bf || ''));
      setActivity(profileData?.activity_level || 'Sedentary');
    }
  }, [isOpen, profileData, goalData]);

  const mutation = useMutation({
    mutationFn: async () => {
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const cb = parseFloat(currentBf);
      const tb = parseFloat(targetBf);
      const act = activity;

      // Recalculate macros and goal stats
      const age = profileData?.age || 30;
      const gender = profileData?.gender || 'Male';
      const deficit = goalData?.deficit_kcal || 0;

      const macros = calculateMacros(w, h, age, gender, act);
      const goalStats = calculateGoalStats(macros.tdee, w, cb, tb, deficit);

      await profileService.upsertProfile({
        weight: w,
        height: h,
        activity_level: act as any,
        maintenance_kcal: macros.tdee
        // Removed: protein_target: macros.proteinMid so we don't blow away manual overrides
      });

      await profileService.upsertGoal({
        current_bf: cb,
        target_bf: tb,
        target_weight: parseFloat(goalStats.targetWeightKg),
        target_date: goalStats.targetDateIso
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      haptics.success();
      onClose();
    }
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-[#111113] rounded-t-2xl sm:rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-2xl flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.06)] shrink-0">
          <h2 className="text-[17px] font-semibold text-white">Edit Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(255,255,255,0.6)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto shrink space-y-5">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Weight (kg)</label>
            <input 
              type="number" 
              value={weight} 
              onChange={e => setWeight(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Height (cm)</label>
            <input 
              type="number" 
              value={height} 
              onChange={e => setHeight(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Current BF %</label>
              <input 
                type="number" 
                value={currentBf} 
                onChange={e => setCurrentBf(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Target BF %</label>
              <input 
                type="number" 
                value={targetBf} 
                onChange={e => setTargetBf(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Activity Level</label>
            <select 
              value={activity} 
              onChange={e => setActivity(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors appearance-none"
            >
              <option value="Sedentary" className="bg-[#111113]">Sedentary (Office job, little exercise)</option>
              <option value="Lightly Active" className="bg-[#111113]">Lightly Active (1-3 days/week)</option>
              <option value="Moderately Active" className="bg-[#111113]">Moderately Active (3-5 days/week)</option>
              <option value="Very Active" className="bg-[#111113]">Very Active (6-7 days/week)</option>
              <option value="Athlete" className="bg-[#111113]">Athlete (2x day training)</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-[rgba(255,255,255,0.06)] shrink-0">
          <button 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={cn(
              "w-full rounded-xl py-3.5 font-semibold text-[15px] flex items-center justify-center transition-colors",
              mutation.isPending ? "bg-[#D4FF00]/50 text-black/50" : "bg-[#D4FF00] text-black hover:bg-[#bce600]"
            )}
          >
            {mutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
