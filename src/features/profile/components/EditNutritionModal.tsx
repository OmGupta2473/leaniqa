import React, { useState } from 'react';
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
  const [protein, setProtein] = useState(String(calculatedData?.proteinMid || ''));

  const mutation = useMutation({
    mutationFn: async () => {
      const targetCals = parseFloat(calories);
      const targetPro = parseFloat(protein);
      
      const tdee = calculatedData?.tdee || 0;
      const deficit = tdee - targetCals;

      if (!isNaN(targetPro)) {
        await profileService.upsertProfile({
          protein_target: targetPro
        });
      }

      if (!isNaN(targetCals)) {
        await profileService.upsertGoal({
          deficit_kcal: deficit
        });
      }
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
          <h2 className="text-[17px] font-semibold text-white">Edit Nutrition Targets</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(255,255,255,0.6)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto shrink space-y-5">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Daily Calories (kcal)</label>
            <input 
              type="number" 
              value={calories} 
              onChange={e => setCalories(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-[16px] outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Daily Protein (g)</label>
            <input 
              type="number" 
              value={protein} 
              onChange={e => setProtein(e.target.value)}
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
