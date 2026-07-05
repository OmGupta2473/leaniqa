import re

with open('src/features/reports/services/complianceService.ts', 'r') as f:
    content = f.read()

# Import queryClient
if "import { queryClient }" not in content:
    content = "import { queryClient } from '@/app/query/queryClient';\n" + content

# Fix getScores
old_getScores = """  async getScores(): Promise<{ todayScore: number, weeklyAverage: number, monthlyAverage: number }> {
    const metrics = await reportService.getDailyMetrics();"""

new_getScores = """  async getScores(): Promise<{ todayScore: number, weeklyAverage: number, monthlyAverage: number }> {
    let metrics = queryClient.getQueryData<DbDailyMetric[]>(['dailyMetrics']);
    if (!metrics) {
      metrics = await queryClient.fetchQuery({
        queryKey: ['dailyMetrics'],
        queryFn: () => reportService.getDailyMetrics()
      });
    }"""
content = content.replace(old_getScores, new_getScores)

# Fix updateTodayScore
old_update = """    try {
      const userId = await authService.getUserId();
      const profile = await profileService.getProfile();
      const goal = await profileService.getGoal();
      
      if (!profile) return null;
      
      const today = getLocalDateString();
      
      // Fetch today's data
      const meals = await mealService.getTodaysMeals();
      const weightLogs = await weightService.getWeightLogs();
      const waterServiceRef = (await import('@/shared/services/waterService')).waterService;
      const waterTotalMl = await waterServiceRef.getTodaysWaterTotal();"""

new_update = """    try {
      const userId = await authService.getUserId();
      
      let profile = queryClient.getQueryData<any>(['profile']);
      if (!profile) profile = await queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
      
      let goal = queryClient.getQueryData<any>(['goal']);
      if (!goal) goal = await queryClient.fetchQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
      
      if (!profile) return null;
      
      const today = getLocalDateString();
      
      // Fetch today's data
      let meals = queryClient.getQueryData<any[]>(['meals', 'today']);
      if (!meals) meals = await queryClient.fetchQuery({ queryKey: ['meals', 'today'], queryFn: () => mealService.getTodaysMeals() });
      
      let weightLogs = queryClient.getQueryData<any[]>(['weightLogs']);
      if (!weightLogs) weightLogs = await queryClient.fetchQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() });
      
      const waterServiceRef = (await import('@/shared/services/waterService')).waterService;
      const waterTotalMl = await waterServiceRef.getTodaysWaterTotal();"""
content = content.replace(old_update, new_update)

with open('src/features/reports/services/complianceService.ts', 'w') as f:
    f.write(content)
