import re

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'r') as f:
    content = f.read()

# Replace the useQuery calls to extract isLoading
search_str = """  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals = [] } = useQuery({ queryKey: ['meals', 'month'], queryFn: () => mealService.getMeals({ days: 35, limit: 2000 }) });
  const { data: dailyMetrics = [] } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });"""

replace_str = """  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal, isLoading: goalLoading } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals = [], isLoading: mealsLoading } = useQuery({ queryKey: ['meals', 'month'], queryFn: () => mealService.getMeals({ days: 35, limit: 2000 }) });
  const { data: dailyMetrics = [], isLoading: metricsLoading } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });

  const isLoading = profileLoading || goalLoading || mealsLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
      </div>
    );
  }"""

content = content.replace(search_str, replace_str)

with open('src/features/reports/pages/WeeklyReportPage.tsx', 'w') as f:
    f.write(content)
