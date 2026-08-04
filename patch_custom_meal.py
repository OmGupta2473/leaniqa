import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# Replace the wrong handleCustomMealSave with a proper mutation
old_save = """  const handleCustomMealSave = (mealData: any) => {
    addMealMutation.mutate(mealData);
  };"""

new_save = """  const customMealMutation = useMutation({
    mutationFn: async (mealData: any) => {
      return await mealService.addMeal(mealData);
    },
    onSuccess: (data) => {
      analytics.trackEvent('Custom Meal Logged', { calories: data.calories });
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals"] }),
        queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
        queryClient.invalidateQueries({ queryKey: ["complianceScore"] })
      ]).catch(console.error);
    }
  });

  const handleCustomMealSave = (mealData: any) => {
    customMealMutation.mutate(mealData);
  };"""

content = content.replace(old_save, new_save)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

