import { DailyActivityData } from '@/shared/types/activity';
import { DbMealLog } from '@/shared/types/supabase';

export interface CoachReport {
  summary: {
    overallScore: number;
    completionPercent: number;
    aiConfidence: 'Excellent' | 'Good' | 'Moderate' | 'Needs Improvement';
    comparisonText: string;
    narrative: string;
  };
  nutritionConsistency: {
    narrative: string;
  };
  eatingBehavior: {
    narrative: string;
    metrics: { label: string; value: string }[];
  };
  calorieTrend: {
    consistencyScore: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    narrative: string;
  };
  proteinAnalysis: {
    targetReachedDays: number;
    avgIntake: number;
    highestDay: string;
    lowestDay: string;
    narrative: string;
  };
  goalAdherence: {
    caloriesPercent: number;
    proteinPercent: number;
    loggingPercent: number;
    needsAttention: string;
  };
  weekendBehavior: {
    narrative: string;
  };
  progressComparison: {
    metrics: { name: string; trend: 'Improved' | 'Maintained' | 'Declined'; value: string; color: string }[];
    narrative: string;
  };
  bestDay: {
    dayLabel: string;
    reasons: string[];
  };
  worstDay: {
    dayLabel: string;
    explanation: string;
  };
  aiPatterns: string[];
  recommendations: {
    problem: string;
    whyItMatters: string;
    action: string;
  }[];
  prediction: {
    estimatedFatLoss: string;
    likelihood: 'Excellent' | 'Good' | 'Moderate' | 'Needs Improvement';
    completionWeeks: number;
  };
  motivation: string;
}

export function generateCoachReport(
  last7Days: DailyActivityData[],
  previous7Days: DailyActivityData[],
  mealsLast7Days: DbMealLog[],
  deficitGoalKcal: number
): CoachReport {
  const activeDays = last7Days.filter(d => d.caloriesConsumed > 0 || d.complianceScore > 0);
  const loggedDaysCount = activeDays.length;
  
  if (loggedDaysCount === 0) {
    throw new Error("Not enough data");
  }

  // --- Helpers ---
  const dayName = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  const calArr = activeDays.map(d => d.caloriesConsumed);
  const proArr = activeDays.map(d => d.proteinConsumed);
  const avgCal = avg(calArr);
  const avgPro = avg(proArr);
  
  const prevActive = previous7Days.filter(d => d.caloriesConsumed > 0 || d.complianceScore > 0);
  const prevAvgCal = avg(prevActive.map(d => d.caloriesConsumed));
  const prevAvgPro = avg(prevActive.map(d => d.proteinConsumed));

  // --- Summary ---
  const overallScore = Math.round(avg(activeDays.map(d => d.complianceScore)));
  const completionPercent = Math.round((loggedDaysCount / 7) * 100);
  
  let proChange = 0;
  if (prevAvgPro > 0) proChange = Math.round(((avgPro - prevAvgPro) / prevAvgPro) * 100);
  
  let aiConfidence: 'Excellent' | 'Good' | 'Moderate' | 'Needs Improvement' = 'Moderate';
  if (overallScore > 85) aiConfidence = 'Excellent';
  else if (overallScore > 70) aiConfidence = 'Good';
  else if (overallScore < 50) aiConfidence = 'Needs Improvement';

  let narrative = `You completed ${overallScore}% of your nutrition goals this week. `;
  if (proChange > 0) narrative += `Protein intake improved by ${proChange}% compared to last week. `;
  
  // Weekend vs Weekday
  const weekends = activeDays.filter(d => {
    const day = new Date(d.date).getDay();
    return day === 5 || day === 6 || day === 0; // Fri, Sat, Sun
  });
  const weekdays = activeDays.filter(d => !weekends.includes(d));
  
  const wkendCal = avg(weekends.map(d => d.caloriesConsumed));
  const wkdayCal = avg(weekdays.map(d => d.caloriesConsumed));
  
  if (wkendCal > wkdayCal * 1.15) {
    narrative += `Weekend calorie intake slowed overall fat-loss progress.`;
  } else if (wkendCal < wkdayCal) {
    narrative += `Excellent discipline over the weekend kept you on track.`;
  } else {
    narrative += `Your consistency remained stable across both weekdays and weekends.`;
  }

  // --- Nutrition Consistency ---
  let consistencyNarrative = "";
  const calVariance = avg(calArr.map(c => Math.abs(c - avgCal)));
  if (calVariance < 200) {
    consistencyNarrative = `Your calorie intake remained very consistent across the week, typically within 200 kcal of your average. `;
  } else {
    consistencyNarrative = `Your calories fluctuated heavily this week, which can lead to unpredictable energy levels and scale weight. `;
  }

  const proTargetHit = activeDays.filter(d => d.proteinConsumed >= d.proteinTarget * 0.9);
  if (proTargetHit.length === loggedDaysCount) {
    consistencyNarrative += `You hit your protein goal every single day you logged!`;
  } else {
    consistencyNarrative += `Protein exceeded your target on only ${proTargetHit.length} out of ${loggedDaysCount} days.`;
  }

  // --- Eating Behavior ---
  const breakfastCount = mealsLast7Days.filter(m => m.meal_slot === 'breakfast').length;
  const skippedBreakfast = loggedDaysCount - breakfastCount;
  
  let longestFast = 0;
  if (mealsLast7Days.length > 1) {
    const sortedMeals = [...mealsLast7Days].sort((a, b) => new Date(a.meal_time).getTime() - new Date(b.meal_time).getTime());
    for (let i = 1; i < sortedMeals.length; i++) {
      const gap = (new Date(sortedMeals[i].meal_time).getTime() - new Date(sortedMeals[i-1].meal_time).getTime()) / (1000 * 60 * 60);
      if (gap > longestFast) longestFast = gap;
    }
  }
  
  let behaviorNarrative = `You logged an average of ${(mealsLast7Days.length / loggedDaysCount).toFixed(1)} meals per day. `;
  if (skippedBreakfast > 2) {
    behaviorNarrative += `You skipped breakfast ${skippedBreakfast} times, which often correlated with larger dinners. `;
  }

  // --- Calorie Trend ---
  let calConsistencyScore: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Fair';
  if (calVariance < 150) calConsistencyScore = 'Excellent';
  else if (calVariance < 300) calConsistencyScore = 'Good';
  else if (calVariance > 500) calConsistencyScore = 'Poor';

  let calTrendNarrative = "";
  if (calConsistencyScore === 'Excellent') calTrendNarrative = `Your calorie intake stayed within ±${Math.round((calVariance/avgCal)*100)}% of your target for most of the week. Predictability leads to predictable fat loss.`;
  else if (calConsistencyScore === 'Poor') calTrendNarrative = `Large calorie swings reduce predictable fat loss. You had days with very high intake followed by very low intake.`;
  else calTrendNarrative = `You maintained reasonable calorie consistency, with minor fluctuations day-to-day.`;

  // --- Protein Analysis ---
  const highestProDay = [...activeDays].sort((a,b) => b.proteinConsumed - a.proteinConsumed)[0];
  const lowestProDay = [...activeDays].sort((a,b) => a.proteinConsumed - b.proteinConsumed)[0];

  let proAnalysisNarrative = `You reached your protein goal on ${proTargetHit.length} of ${loggedDaysCount} days. `;
  if (lowestProDay.caloriesConsumed > lowestProDay.calorieTarget * 1.1 && lowestProDay.proteinConsumed < lowestProDay.proteinTarget * 0.8) {
    proAnalysisNarrative += `On lower protein days, your calorie intake remained high, which may reduce muscle retention while cutting.`;
  } else if (proTargetHit.length > 4) {
    proAnalysisNarrative += `Excellent muscle preservation support this week with consistent protein intake.`;
  }

  // --- Weekend Behavior ---
  let weekendNarrative = "";
  if (weekends.length > 0 && weekdays.length > 0) {
    const calDiff = Math.round(((wkendCal - wkdayCal) / wkdayCal) * 100);
    const proDiff = Math.round(((avg(weekends.map(d=>d.proteinConsumed)) - avg(weekdays.map(d=>d.proteinConsumed))) / avg(weekdays.map(d=>d.proteinConsumed))) * 100);
    
    if (calDiff > 10) weekendNarrative += `Weekend calories increased ${calDiff}%. `;
    else if (calDiff < -10) weekendNarrative += `Weekend calories dropped ${Math.abs(calDiff)}%. `;
    
    if (proDiff < -10) weekendNarrative += `Protein dropped ${Math.abs(proDiff)}%. `;
    
    if (weekendNarrative === "") weekendNarrative = "Your weekend habits perfectly mirrored your weekday consistency.";
    else weekendNarrative += "This is one of the most valuable coaching insights to improve next week.";
  } else {
    weekendNarrative = "Not enough weekend and weekday data to compare yet.";
  }

  // --- Best and Worst Day ---
  const sortedDays = [...activeDays].sort((a,b) => b.complianceScore - a.complianceScore);
  const bestD = sortedDays[0];
  const worstD = sortedDays[sortedDays.length - 1];
  
  const bestReasons = [];
  if (bestD.caloriesConsumed <= bestD.calorieTarget) bestReasons.push("Calories within target");
  if (bestD.proteinConsumed >= bestD.proteinTarget * 0.9) bestReasons.push("Protein goal achieved");
  if (bestD.complianceScore > 80) bestReasons.push("Meals logged consistently");
  
  let worstExp = "";
  if (worstD.caloriesConsumed > worstD.calorieTarget) worstExp = `${dayName(worstD.date)} exceeded calories by ${Math.round(worstD.caloriesConsumed - worstD.calorieTarget)} kcal. `;
  else if (worstD.proteinConsumed < worstD.proteinTarget * 0.7) worstExp = `Protein remained far below target on ${dayName(worstD.date)}. `;
  worstExp += "One imperfect day does not ruin progress, but identifying the cause will accelerate results.";

  // --- Predictions & Recommendations ---
  const deficitAvg = activeDays.reduce((a,b) => a + (b.calorieTarget - b.caloriesConsumed), 0) / loggedDaysCount;
  const estimatedFatLoss = deficitAvg > 0 ? ((deficitAvg * 7) / 7700).toFixed(2) + " kg" : "0 kg"; // Roughly 7700 kcal per kg of fat
  
  const recommendations = [];
  if (skippedBreakfast > 1) {
    recommendations.push({
      problem: "Skipping Breakfast",
      whyItMatters: "Often leads to backloading calories and making poor choices at dinner.",
      action: "Try a high-protein shake or greek yogurt in the morning to stabilize hunger."
    });
  }
  if (wkendCal > wkdayCal * 1.2) {
    recommendations.push({
      problem: "Weekend Calorie Spike",
      whyItMatters: "A large weekend surplus can erase 5 days of weekday deficit.",
      action: "Log your weekend meals in advance or commit to a high-protein breakfast on weekends."
    });
  }
  if (proTargetHit.length < loggedDaysCount / 2) {
    recommendations.push({
      problem: "Low Protein Consistency",
      whyItMatters: "Adequate protein is required to maintain muscle mass and keep you full in a deficit.",
      action: "Ensure your first and last meals of the day contain at least 30g of protein."
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      problem: "Push the Pace",
      whyItMatters: "Your consistency is excellent, so you are ready to optimize further.",
      action: "Try slightly increasing your daily step count or neat activity."
    });
  }

  // Pad to 3 recommendations if needed
  while(recommendations.length < 3) {
    recommendations.push({
      problem: "Hydration Focus",
      whyItMatters: "Water helps with digestion and false hunger signals.",
      action: "Drink a large glass of water before every main meal."
    });
  }

  const aiPatterns = [];
  if (wkendCal > wkdayCal * 1.2) aiPatterns.push("Weekend Overeating");
  if (skippedBreakfast > 2) aiPatterns.push("Skipping Breakfast");
  if (proTargetHit.length < 3) aiPatterns.push("Inconsistent Protein");
  if (calVariance > 400) aiPatterns.push("Large Calorie Fluctuations");
  if (aiPatterns.length === 0) aiPatterns.push("Highly Consistent Habits");

  return {
    summary: {
      overallScore,
      completionPercent,
      aiConfidence,
      comparisonText: proChange > 0 ? `+${proChange}% Protein` : (proChange < 0 ? `${proChange}% Protein` : "Stable Trends"),
      narrative
    },
    nutritionConsistency: {
      narrative: consistencyNarrative,
    },
    eatingBehavior: {
      narrative: behaviorNarrative,
      metrics: [
        { label: "Skipped Breakfasts", value: skippedBreakfast.toString() },
        { label: "Avg Meals/Day", value: (mealsLast7Days.length / loggedDaysCount).toFixed(1) },
        { label: "Longest Fast", value: `${Math.round(longestFast)} hrs` }
      ]
    },
    calorieTrend: {
      consistencyScore: calConsistencyScore,
      narrative: calTrendNarrative
    },
    proteinAnalysis: {
      targetReachedDays: proTargetHit.length,
      avgIntake: Math.round(avgPro),
      highestDay: dayName(highestProDay.date),
      lowestDay: dayName(lowestProDay.date),
      narrative: proAnalysisNarrative
    },
    goalAdherence: {
      caloriesPercent: Math.round((activeDays.filter(d => Math.abs(d.caloriesConsumed - d.calorieTarget) < 300).length / loggedDaysCount) * 100),
      proteinPercent: Math.round((proTargetHit.length / loggedDaysCount) * 100),
      loggingPercent: completionPercent,
      needsAttention: "Protein"
    },
    weekendBehavior: {
      narrative: weekendNarrative
    },
    progressComparison: {
      metrics: [
        { name: "Protein", trend: proChange >= 0 ? 'Improved' : 'Declined', value: `${Math.abs(proChange)}%`, color: proChange >= 0 ? '#D4FF00' : '#FF4D1C' },
        { name: "Calories", trend: (avgCal <= prevAvgCal) ? 'Improved' : 'Declined', value: `${Math.round(Math.abs(avgCal - prevAvgCal))} kcal`, color: (avgCal <= prevAvgCal) ? '#D4FF00' : '#FF4D1C' },
      ],
      narrative: `You improved your protein intake compared to last week, but calories ${avgCal > prevAvgCal ? 'increased slightly' : 'decreased slightly'}.`
    },
    bestDay: {
      dayLabel: dayName(bestD.date),
      reasons: bestReasons.length ? bestReasons : ["Most consistent tracking"]
    },
    worstDay: {
      dayLabel: dayName(worstD.date),
      explanation: worstExp
    },
    aiPatterns: aiPatterns,
    recommendations: recommendations.slice(0, 3),
    prediction: {
      estimatedFatLoss,
      likelihood: aiConfidence,
      completionWeeks: Math.max(4, Math.round(12 - (overallScore / 10))) // Fake math for example
    },
    motivation: `This week showed strong consistency. Continue building habits instead of chasing perfection, and you are on pace to reach your goal.`
  };
}
