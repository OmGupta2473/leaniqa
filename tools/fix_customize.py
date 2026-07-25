import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    lines = f.readlines()

new_step_5 = """            {/* STEP 5: Customize */}
            {step === 5 && selectedStrategy && (() => {
              const minC = Math.max(1200, tdee - 1000);
              const maxC = tdee + 2000;
              const minP = Math.round(currentWeight * 1.4);
              const maxP = Math.round(currentWeight * 2.5);
              
              const currentCals = typeof customCalories === 'number' ? customCalories : (parseInt(customCalories as string) || minC);
              const currentPro = typeof customProtein === 'number' ? customProtein : (parseInt(customProtein as string) || minP);

              return (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col flex-1 pb-20"
              >
                <div className="text-center mb-8">
                  <h2 className="text-[28px] font-bold tracking-tight text-white mb-3">Want to fine-tune your plan?</h2>
                  <p className="text-[16px] text-[rgba(255,255,255,0.6)]">Adjust your targets below. The AI will recalculate the rest.</p>
                </div>

                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 mb-6">
                  {/* Calories */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[16px] font-semibold text-white">Daily Calories</span>
                      <input 
                        type="number" 
                        value={customCalories === null ? '' : customCalories}
                        onChange={(e) => setCustomCalories(e.target.value)}
                        className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2 w-28 text-right text-[18px] font-bold text-[#D4FF00] focus:outline-none focus:border-[#D4FF00]"
                      />
                    </div>
                    <input 
                      type="range"
                      min={minC}
                      max={maxC}
                      step={10}
                      value={currentCals}
                      onChange={(e) => setCustomCalories(parseInt(e.target.value))}
                      className="w-full h-2 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                    />
                    <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.4)] mt-2 font-medium">
                      <span>{minC} kcal</span>
                      <span>{maxC} kcal</span>
                    </div>
                  </div>

                  {/* Protein */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[16px] font-semibold text-white">Protein (g)</span>
                      <input 
                        type="number" 
                        value={customProtein === null ? '' : customProtein}
                        onChange={(e) => setCustomProtein(e.target.value)}
                        className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2 w-28 text-right text-[18px] font-bold text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <input 
                      type="range"
                      min={minP}
                      max={maxP}
                      step={1}
                      value={currentPro}
                      onChange={(e) => setCustomProtein(parseInt(e.target.value))}
                      className="w-full h-2 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-[11px] text-[rgba(255,255,255,0.4)] mt-2 font-medium">
                      <span>{minP}g</span>
                      <span>{maxP}g</span>
                    </div>
                  </div>

                  {/* Read-only Fat & Carbs */}
                  <div className="space-y-4 border-t border-[rgba(255,255,255,0.06)] pt-6 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[15px] text-[rgba(255,255,255,0.6)]">Fat (g)</span>
                      <div className="bg-[rgba(0,0,0,0.2)] rounded-xl px-4 py-2 w-24 text-right text-[15px] font-semibold text-[rgba(255,255,255,0.6)]">
                        {customFat}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[15px] text-[rgba(255,255,255,0.6)]">Carbs (g)</span>
                      <div className="bg-[rgba(0,0,0,0.2)] rounded-xl px-4 py-2 w-24 text-right text-[15px] font-semibold text-[rgba(255,255,255,0.6)]">
                        {customCarbs}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[rgba(212,255,0,0.05)] border border-[rgba(212,255,0,0.2)] rounded-2xl p-5 mb-8 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[rgba(212,255,0,0.1)] flex items-center justify-center shrink-0">
                    <span className="text-[18px]">🤖</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-white mb-1">AI Coach Feedback</h4>
                    <p className="text-[13px] text-[rgba(255,255,255,0.7)] leading-relaxed">
                      {currentCals < 1500 ? "This is a very aggressive deficit. Ensure you prioritize protein." : 
                       currentCals > tdee - 200 ? "This is a very small deficit. Progress will be slow but easily sustainable." : 
                       "Great balance. Your protein is sufficient for muscle retention."}
                    </p>
                  </div>
                </div>

                <div className="fixed bottom-[80px] left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-40">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      let finalCals = typeof customCalories === 'number' ? customCalories : (parseInt(customCalories as string) || minC);
                      let finalPro = typeof customProtein === 'number' ? customProtein : (parseInt(customProtein as string) || minP);
                      if (finalCals < minC) finalCals = minC;
                      if (finalCals > maxC) finalCals = maxC;
                      if (finalPro < minP) finalPro = minP;
                      if (finalPro > maxP) finalPro = maxP;
                      setCustomCalories(finalCals);
                      setCustomProtein(finalPro);
                      haptics.success(); 
                      setStep(6); 
                    }}
                    className="pointer-events-auto w-full max-w-lg mx-auto block py-4 rounded-full bg-[#D4FF00] text-black font-bold text-[17px] shadow-[0_0_30px_rgba(212,255,0,0.3)]"
                  >
                    Review Final Plan
                  </motion.button>
                </div>
              </motion.div>
              );
            })}
"""

new_lines = lines[:782] + [new_step_5] + lines[862:]
content = "".join(new_lines)

# 1. State types
content = content.replace(
    'const [customCalories, setCustomCalories] = useState<number | null>(null);',
    'const [customCalories, setCustomCalories] = useState<number | string | null>(null);'
)
content = content.replace(
    'const [customProtein, setCustomProtein] = useState<number | null>(null);',
    'const [customProtein, setCustomProtein] = useState<number | string | null>(null);'
)

# 2. useEffect for carbs
old_carbs_effect = """  useEffect(() => {
    if (customCalories !== null && customProtein !== null && customFat !== null) {
      const pCals = customProtein * 4;
      const fCals = customFat * 9;
      const rem = customCalories - pCals - fCals;
      setCustomCarbs(Math.max(0, Math.round(rem / 4)));
    }
  }, [customCalories, customProtein, customFat]);"""

new_carbs_effect = """  useEffect(() => {
    const c = typeof customCalories === 'number' ? customCalories : parseInt(customCalories as string);
    const p = typeof customProtein === 'number' ? customProtein : parseInt(customProtein as string);
    if (!isNaN(c) && !isNaN(p) && customFat !== null) {
      const pCals = p * 4;
      const fCals = customFat * 9;
      const rem = c - pCals - fCals;
      setCustomCarbs(Math.max(0, Math.round(rem / 4)));
    }
  }, [customCalories, customProtein, customFat]);"""
content = content.replace(old_carbs_effect, new_carbs_effect)

# 3. Handle finish
old_handle_finish = """  const handleFinish = () => {
    if (!selectedStrategy) return;
    
    // Check if custom macros apply
    let finalCals = selectedStrategy.dailyTarget;
    let finalDeficit = selectedStrategy.deficit;
    
    if (customCalories && customCalories !== selectedStrategy.dailyTarget) {
      finalCals = customCalories;
      finalDeficit = tdee - customCalories;
    }
    
    saveMutation.mutate({
      current_bf: currentBfMid,
      target_bf: targetBfMid,
      strategy: selectedStrategy.name,
      deficit_kcal: finalDeficit,
      fatToLoseKg,
      dailyTarget: finalCals,
      targetWeightKg,
      estimatedWeeks: selectedStrategy.weeks,
      estimatedCompletionDate: selectedStrategy.dateStr,
      targetDateIso: selectedStrategy.targetDateIso,
      macros: {
        protein: customProtein,
        fat: customFat,
        carbs: customCarbs
      }
    });
  };"""

new_handle_finish = """  const handleFinish = () => {
    if (!selectedStrategy) return;
    
    const parsedCals = typeof customCalories === 'number' ? customCalories : parseInt(customCalories as string);
    const parsedProtein = typeof customProtein === 'number' ? customProtein : parseInt(customProtein as string);
    
    let finalCals = selectedStrategy.dailyTarget;
    let finalDeficit = selectedStrategy.deficit;
    
    if (!isNaN(parsedCals) && parsedCals !== selectedStrategy.dailyTarget) {
      finalCals = parsedCals;
      finalDeficit = tdee - parsedCals;
    }
    
    saveMutation.mutate({
      current_bf: currentBfMid,
      target_bf: targetBfMid,
      strategy: selectedStrategy.name,
      deficit_kcal: finalDeficit,
      fatToLoseKg,
      dailyTarget: finalCals,
      targetWeightKg,
      estimatedWeeks: selectedStrategy.weeks,
      estimatedCompletionDate: selectedStrategy.dateStr,
      targetDateIso: selectedStrategy.targetDateIso,
      macros: {
        protein: isNaN(parsedProtein) ? proteinMid : parsedProtein,
        fat: customFat,
        carbs: customCarbs
      }
    });
  };"""
content = content.replace(old_handle_finish, new_handle_finish)

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)

print("Done")
