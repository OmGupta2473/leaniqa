import sys

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

# Fix the useEffect for step 0
old_effect = """  // AI Step 1 Progression
  useEffect(() => {
    if (step === 0 && !goal && !onboardingData?.chosenStrategyName) {"""
new_effect = """  // AI Step 1 Progression
  useEffect(() => {
    if (step === 0 && !goal) {
      setAnalysisProgress(0);"""
content = content.replace(old_effect, new_effect)
content = content.replace("}, [step, goal, onboardingData?.chosenStrategyName]);", "}, [step, goal]);")

# Fix the reset button to also clear local state
old_reset = """                    onClick={async () => {
                      try {
                        await profileService.deleteGoal();
                        setResetGoalConfirm(false);
                        queryClient.setQueryData(['goal'], null);
                        setStep(0);
                      } catch { alert('Failed to reset goal. Try again.'); }
                    }}"""
new_reset = """                    onClick={async () => {
                      try {
                        await profileService.deleteGoal();
                        setResetGoalConfirm(false);
                        queryClient.setQueryData(['goal'], null);
                        
                        // Clear local state
                        setOnboardingData({
                          ...onboardingData,
                          chosenStrategyName: undefined,
                          currentBodyFatPct: undefined,
                          targetBodyFatPct: undefined,
                          fatToLoseKg: undefined,
                          dailyCalorieGoal: undefined,
                          dailyDeficit: undefined,
                          targetWeightKg: undefined,
                          estimatedWeeks: undefined,
                          estimatedCompletionDate: undefined,
                          macros: undefined
                        });
                        
                        setStep(0);
                        setAnalysisProgress(0);
                      } catch (e) { alert('Failed to reset goal. Try again.'); console.error(e); }
                    }}"""
content = content.replace(old_reset, new_reset)

with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
