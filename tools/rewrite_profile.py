import re

with open("src/features/profile/pages/ProfilePage.tsx", "r") as f:
    content = f.read()

replacement = """
  // All the existing display values
  const displayVal = (val: any) => val !== undefined && val !== null && !Number.isNaN(val) ? val : '—';
  
  const name_ = profile?.name ?? onboardingData?.name ?? '';
  const age_ = profile?.age ?? onboardingData?.age;
  const gender_ = profile?.gender ?? onboardingData?.gender;
  const activityLevel_ = profile?.activity_level ?? onboardingData?.activityLevel;
  const weightKg_ = profile?.weight ?? onboardingData?.weightKg;
  const heightCm_ = profile?.height ?? onboardingData?.heightCm;
  
  let calcMacros: any = null;
  if (weightKg_ && heightCm_ && age_ && gender_ && activityLevel_) {
    calcMacros = calculateMacros(weightKg_, heightCm_, age_, gender_, activityLevel_);
  }
  
  let calcGoalStats: any = null;
  const currentBodyFatPct_ = goal?.current_bf ?? onboardingData?.currentBodyFatPct;
  const targetBodyFatPct_ = goal?.target_bf ?? onboardingData?.targetBodyFatPct;
  const deficit_kcal_ = goal?.deficit_kcal ?? onboardingData?.dailyDeficit;
  
  if (calcMacros?.tdee && weightKg_ && currentBodyFatPct_ && targetBodyFatPct_ && deficit_kcal_ !== undefined) {
    calcGoalStats = calculateGoalStats(calcMacros.tdee, weightKg_, currentBodyFatPct_, targetBodyFatPct_, deficit_kcal_);
  }

  const tdee_ = profile?.maintenance_kcal ?? calcMacros?.tdee ?? onboardingData?.tdee;
  const proteinMin_ = calcMacros?.proteinMin ?? onboardingData?.proteinMin;
  const proteinMax_ = calcMacros?.proteinMax ?? onboardingData?.proteinMax;
  const fatMin_ = calcMacros?.fatMin ?? onboardingData?.fatMin;
  const fatMax_ = calcMacros?.fatMax ?? onboardingData?.fatMax;
  const carbMin_ = calcMacros?.carbMin ?? onboardingData?.carbMin;
  const carbMax_ = calcMacros?.carbMax ?? onboardingData?.carbMax;
  const fiberMin_ = calcMacros?.fiberMin ?? onboardingData?.fiberMin;
  const fiberMax_ = calcMacros?.fiberMax ?? onboardingData?.fiberMax;
  const waterLitres_ = calcMacros?.waterLitres ?? onboardingData?.waterLitres;

  const fatToLoseKg_ = calcGoalStats?.fatToLoseKg ?? onboardingData?.fatToLoseKg;
  const targetWeightKg_ = goal?.target_weight ?? calcGoalStats?.targetWeightKg ?? onboardingData?.targetWeightKg;
  const chosenStrategyName_ = goal?.strategy ?? onboardingData?.chosenStrategyName;
  const dailyCalorieGoal_ = calcGoalStats?.dailyCalorieGoal ?? onboardingData?.dailyCalorieGoal;
  const dailyDeficit_ = goal?.deficit_kcal ?? onboardingData?.dailyDeficit;
  const estimatedWeeks_ = calcGoalStats?.estimatedWeeks ?? onboardingData?.estimatedWeeks;
  const estimatedCompletionDate_ = goal?.target_date ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : (calcGoalStats?.targetDateStr ?? onboardingData?.estimatedCompletionDate);
"""

pattern = r"  // All the existing display values.*?const estimatedCompletionDate_[^\n]+\n"

new_content = re.sub(pattern, replacement.strip() + "\n", content, flags=re.DOTALL)

with open("src/features/profile/pages/ProfilePage.tsx", "w") as f:
    f.write(new_content)
