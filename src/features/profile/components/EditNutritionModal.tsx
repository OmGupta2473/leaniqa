import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { profileService } from '../services/profileService';
import { haptics } from '@/shared/utils/haptics';
import { cn } from '@/shared/utils/utils';

interface EditNutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculatedData: any;
}

export function EditNutritionModal({ isOpen, onClose, calculatedData }: EditNutritionModalProps) {
  const queryClient = useQueryClient();
  const [calories, setCalories] = useState(String(calculatedData?.dailyCalorieGoal || ''));
  const [protein, setProtein] = useState(String(calculatedData?.targetMacros?.protein || ''));
  const [carbs, setCarbs] = useState(String(calculatedData?.targetMacros?.carbs || ''));
  const [fat, setFat] = useState(String(calculatedData?.targetMacros?.fat || ''));
  const [water, setWater] = useState(String(calculatedData?.waterLitres || ''));
  const [errorMsg, setErrorMsg] = useState('');

  // Track if macros were manually overridden by the user
  const [manualOverride, setManualOverride] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCalories(String(calculatedData?.dailyCalorieGoal || ''));
      setProtein(String(calculatedData?.targetMacros?.protein || calculatedData?.proteinMid || ''));
      setCarbs(String(calculatedData?.targetMacros?.carbs || ''));
      setFat(String(calculatedData?.targetMacros?.fat || ''));
      setWater(String(calculatedData?.waterLitres || ''));
      setManualOverride(calculatedData?.manualOverrides?.carbs || calculatedData?.manualOverrides?.fat || false);
      setErrorMsg('');
    }
  }, [isOpen, calculatedData]);

  const handleCaloriesChange = (val: string) => {
    setCalories(val);
    const cals = parseFloat(val);
    if (!isNaN(cals) && !manualOverride) {
      // Recalculate default macros if no manual override
      const p = parseFloat(protein) || (calculatedData?.targetMacros?.protein || 0);
      let fatPercentageMid = 0.265;
      const act = calculatedData?.activityLevel || 'Sedentary';
      if (act === 'Sedentary') fatPercentageMid = 0.25;
      else if (act === 'Moderately Active' || act === 'Moderate') fatPercentageMid = 0.275;
      else if (act === 'Very Active' || act === 'Active') fatPercentageMid = 0.285;
      else if (act === 'Athlete' || act === 'Very active') fatPercentageMid = 0.30;
      
      const newFat = Math.round((cals * fatPercentageMid) / 9);
      const newCarbs = Math.max(0, Math.round((cals - (p * 4) - (newFat * 9)) / 4));
      
      setFat(String(newFat));
      setCarbs(String(newCarbs));
    }
  };

  const handleMacroChange = (type: 'protein' | 'carbs' | 'fat', val: string) => {
    setManualOverride(true);
    if (type === 'protein') setProtein(val);
    if (type === 'carbs') setCarbs(val);
    if (type === 'fat') setFat(val);

    const p = type === 'protein' ? parseFloat(val) : parseFloat(protein);
    const c = type === 'carbs' ? parseFloat(val) : parseFloat(carbs);
    const f = type === 'fat' ? parseFloat(val) : parseFloat(fat);

    if (!isNaN(p) && !isNaN(c) && !isNaN(f)) {
      const newCals = Math.round((p * 4) + (c * 4) + (f * 9));
      setCalories(String(newCals));
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const targetCals = parseFloat(calories);
      const targetPro = parseFloat(protein);
      const targetCarbs = parseFloat(carbs);
      const targetFat = parseFloat(fat);
      const targetWater = parseFloat(water);
      
      if (isNaN(targetCals) || targetCals < 500 || targetCals > 10000) {
        throw new Error("Please enter a valid daily calorie goal (500-10000)");
      }
      if (isNaN(targetPro) || targetPro < 0 || targetPro > 500) {
        throw new Error("Please enter a valid protein goal (0-500g)");
      }
      if (isNaN(targetCarbs) || targetCarbs < 0 || targetCarbs > 1500) {
        throw new Error("Please enter a valid carbohydrate goal (0-1500g)");
      }
      if (isNaN(targetFat) || targetFat < 0 || targetFat > 500) {
        throw new Error("Please enter a valid fat goal (0-500g)");
      }
      if (isNaN(targetWater) || targetWater < 0 || targetWater > 20) {
        throw new Error("Please enter a valid water goal (0-20L)");
      }

      const profilePayload: any = {};
      const goalPayload: any = {};

      // Only update if changed
      const originalCals = calculatedData?.dailyCalorieGoal;
      if (originalCals !== targetCals) {
        const tdee = calculatedData?.tdee || 0;
        goalPayload.deficit_kcal = tdee - targetCals;
      }

      const originalPro = calculatedData?.targetMacros?.protein || calculatedData?.proteinMid;
      if (originalPro !== targetPro) {
        profilePayload.protein_target = targetPro;
      }

      const originalCarbs = calculatedData?.targetMacros?.carbs;
      const originalFat = calculatedData?.targetMacros?.fat;
      
      // If manualOverride is active, and carbs/fat changed, save them
      if (manualOverride && (originalCarbs !== targetCarbs || originalFat !== targetFat)) {
        profilePayload.carbs_target = targetCarbs;
        profilePayload.fat_target = targetFat;
      }

      // Always include water_target to ensure it saves
      profilePayload.water_target = targetWater;

      if (Object.keys(profilePayload).length > 0) {
        await profileService.upsertProfile(profilePayload);
      }

      if (Object.keys(goalPayload).length > 0) {
        await profileService.upsertGoal(goalPayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      queryClient.invalidateQueries(); // invalidate everything depending on macros
      haptics.success();
      onClose();
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Failed to update targets.");
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
          <h2 className="text-[17px] font-semibold text-white">Edit Nutrition Targets</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(255,255,255,0.6)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto shrink space-y-5">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[14px]">
              {errorMsg}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Daily Calories (kcal)</label>
            <input 
              type="number" 
              value={calories} 
              onChange={e => handleCaloriesChange(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Daily Protein (g)</label>
            <input 
              type="number" 
              value={protein} 
              onChange={e => handleMacroChange('protein', e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Daily Carbohydrates (g)</label>
            <input 
              type="number" 
              value={carbs} 
              onChange={e => handleMacroChange('carbs', e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Daily Fat (g)</label>
            <input 
              type="number" 
              value={fat} 
              onChange={e => handleMacroChange('fat', e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Daily Water (L)</label>
            <input 
              type="number" 
              step="0.1"
              value={water} 
              onChange={e => setWater(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
            />
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
            {mutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Save Targets'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
