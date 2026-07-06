import re

with open('src/features/reports/services/complianceService.ts', 'r') as f:
    content = f.read()

old_update = """    try {
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
      
      const waterServiceRef = (await import('@/shared/services/waterService')).waterService;"""

new_update = """    try {
      const [userId, profile, goal, meals, weightLogs, waterServiceRef] = await Promise.all([
        authService.getUserId(),
        queryClient.getQueryData<any>(['profile']) || queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() }),
        queryClient.getQueryData<any>(['goal']) || queryClient.fetchQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() }),
        queryClient.getQueryData<any[]>(['meals', 'today']) || queryClient.fetchQuery({ queryKey: ['meals', 'today'], queryFn: () => mealService.getTodaysMeals() }),
        queryClient.getQueryData<any[]>(['weightLogs']) || queryClient.fetchQuery({ queryKey: ['weightLogs'], queryFn: () => weightService.getWeightLogs() }),
        import('@/shared/services/waterService').then(m => m.waterService)
      ]);
      
      if (!profile) return null;
      
      const today = getLocalDateString();"""

content = content.replace(old_update, new_update)

with open('src/features/reports/services/complianceService.ts', 'w') as f:
    f.write(content)
