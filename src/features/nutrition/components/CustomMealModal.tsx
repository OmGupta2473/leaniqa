import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Info } from 'lucide-react';
import { DbMealLog } from '@/shared/types/supabase';

interface CustomMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Omit<DbMealLog, 'id' | 'user_id'>) => void;
  defaultSlot?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | '';
}

export function CustomMealModal({ isOpen, onClose, onSave, defaultSlot }: CustomMealModalProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [slot, setSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(defaultSlot as 'breakfast' | 'lunch' | 'dinner' | 'snack' || 'lunch');
  
  const p = parseFloat(protein) || 0;
  const c = parseFloat(carbs) || 0;
  const f = parseFloat(fat) || 0;
  const calculatedCalories = (p * 4) + (c * 4) + (f * 9);
  const totalMacros = p + c + f;
  
  const cals = parseFloat(calories) || 0;
  const isCaloriesMismatched = totalMacros > 0 && Math.abs(cals - calculatedCalories) > Math.max(cals * 0.2, 50);

  const isValid = name.trim() !== '' && 
                 calories !== '' && !isNaN(parseFloat(calories)) && parseFloat(calories) >= 0 &&
                 protein !== '' && !isNaN(parseFloat(protein)) && parseFloat(protein) >= 0 &&
                 carbs !== '' && !isNaN(parseFloat(carbs)) && parseFloat(carbs) >= 0 &&
                 fat !== '' && !isNaN(parseFloat(fat)) && parseFloat(fat) >= 0;

  useEffect(() => {
    if (isOpen) {
      if (defaultSlot && ['breakfast', 'lunch', 'dinner', 'snack'].includes(defaultSlot)) {
        setSlot(defaultSlot as 'breakfast' | 'lunch' | 'dinner' | 'snack');
      }
    }
  }, [isOpen, defaultSlot]);

  const handleSave = () => {
    if (!isValid) return;
    
    onSave({
      meal_text: name.trim(),
      calories: Math.round(parseFloat(calories)),
      protein: Math.round(parseFloat(protein)),
      carbs: Math.round(parseFloat(carbs)),
      fat: Math.round(parseFloat(fat)),
      fiber: fiber ? Math.round(parseFloat(fiber)) : undefined,
      meal_slot: slot,
      meal_time: new Date().toISOString(),
      tip: "Manually logged meal.",
      meal_source: 'manual' as any
    });
    
    // Reset
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const inputStyle = "w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[14px] px-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#D4FF00] transition-colors text-[16px]";
  const labelStyle = "text-[12px] font-semibold text-[rgba(255,255,255,0.6)] uppercase tracking-wider mb-1.5 block ml-1";

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-md bg-[#111112] sm:rounded-[28px] rounded-t-[28px] border-t sm:border border-[rgba(255,255,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] shrink-0">
              <h2 className="text-lg font-semibold text-white tracking-tight">Create Custom Meal</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                <X size={18} color="#A0A0A5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              
              <div>
                <label className={labelStyle}>Meal Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chicken Salad"
                  autoFocus
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Meal Slot</label>
                <div className="flex gap-2 p-1 bg-[rgba(255,255,255,0.03)] rounded-[14px]">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlot(s as any)}
                      className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] capitalize transition-colors ${
                        slot === s ? 'bg-[#D4FF00] text-black' : 'text-[rgba(255,255,255,0.5)] hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Calories</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="0"
                      className={inputStyle + " pr-12"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[rgba(255,255,255,0.3)]">kcal</span>
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Protein</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="0"
                      className={inputStyle + " pr-8"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[rgba(255,255,255,0.3)]">g</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Carbs</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="0"
                      className={inputStyle + " pr-8"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[rgba(255,255,255,0.3)]">g</span>
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Fat</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="0"
                      className={inputStyle + " pr-8"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[rgba(255,255,255,0.3)]">g</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Fiber (Optional)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    inputMode="decimal"
                    value={fiber}
                    onChange={(e) => setFiber(e.target.value)}
                    placeholder="0"
                    className={inputStyle + " pr-8"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[rgba(255,255,255,0.3)]">g</span>
                </div>
              </div>

              {/* Live Preview */}
              {(totalMacros > 0 || cals > 0) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-[rgba(255,255,255,0.03)] rounded-[16px] p-4 border border-[rgba(255,255,255,0.05)]"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[12px] font-semibold text-[rgba(255,255,255,0.6)] uppercase tracking-wider">Macros</span>
                    {totalMacros > 0 && (
                      <span className="text-[12px] font-medium text-[rgba(255,255,255,0.4)]">
                        ~{Math.round(calculatedCalories)} kcal implied
                      </span>
                    )}
                  </div>
                  
                  {totalMacros > 0 ? (
                    <div className="flex w-full h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${(p / totalMacros) * 100}%` }} className="bg-[#FF4D1C]"></div>
                      <div style={{ width: `${(c / totalMacros) * 100}%` }} className="bg-[#4D9FFF]"></div>
                      <div style={{ width: `${(f / totalMacros) * 100}%` }} className="bg-[#FFB347]"></div>
                    </div>
                  ) : (
                    <div className="flex w-full h-2 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)]"></div>
                  )}
                  
                  <div className="flex justify-between mt-3 text-[12px]">
                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.6)]">
                      <div className="w-2 h-2 rounded-full bg-[#FF4D1C]"></div>
                      {totalMacros > 0 ? Math.round((p / totalMacros) * 100) : 0}% Pro
                    </div>
                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.6)]">
                      <div className="w-2 h-2 rounded-full bg-[#4D9FFF]"></div>
                      {totalMacros > 0 ? Math.round((c / totalMacros) * 100) : 0}% Carb
                    </div>
                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.6)]">
                      <div className="w-2 h-2 rounded-full bg-[#FFB347]"></div>
                      {totalMacros > 0 ? Math.round((f / totalMacros) * 100) : 0}% Fat
                    </div>
                  </div>

                  {isCaloriesMismatched && (
                    <div className="mt-4 flex gap-2 p-3 bg-[rgba(255,179,71,0.1)] text-[#FFB347] rounded-[10px] text-[12px] leading-relaxed">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <span>The calories you entered ({cals} kcal) differ from the macros ({Math.round(calculatedCalories)} kcal). We'll still save what you entered.</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-2 border-t border-[rgba(255,255,255,0.06)] shrink-0 bg-[#111112]">
              <button
                onClick={handleSave}
                disabled={!isValid}
                className="w-full bg-[#D4FF00] disabled:bg-[rgba(212,255,0,0.3)] disabled:text-[rgba(0,0,0,0.5)] hover:bg-[#bce600] text-black font-bold py-3.5 rounded-[16px] text-[15px] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Save Custom Meal
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
