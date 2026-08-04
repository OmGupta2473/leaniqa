with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

old_mutation = """  const customMealMutation = useMutation({
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
  });"""

new_mutation = """  const customMealMutation = useMutation({
    mutationFn: async (mealData: any) => {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        devLog('Offline: queueing custom meal');
        const { offlineSyncService } = await import('@/shared/services/offlineSyncService');
        offlineSyncService.enqueue({ type: 'ADD_MEAL', payload: mealData });
        return { ...mealData, _localOnly: true };
      }
      return await mealService.addMeal(mealData);
    },
    onMutate: async (mealData) => {
      const dateKeyStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
      const now = new Date();
      const isToday = selectedDate.getFullYear() === now.getFullYear() && 
                      selectedDate.getMonth() === now.getMonth() && 
                      selectedDate.getDate() === now.getDate();
      
      await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
      if (isToday) {
        await queryClient.cancelQueries({ queryKey: ["meals"] });
      }

      const previousMeals = queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr]);
      const previousTodayMeals = queryClient.getQueryData<any[]>(["meals"]);
      
      const newMealObj = { ...mealData, id: 'temp-' + Date.now(), _localOnly: true };

      if (previousMeals) {
        queryClient.setQueryData(["meals", "date", dateKeyStr], [...previousMeals, newMealObj]);
      }
      if (isToday && previousTodayMeals) {
        queryClient.setQueryData(["meals"], [...previousTodayMeals, newMealObj]);
      }

      return { previousMeals, previousTodayMeals, isToday };
    },
    onError: (err, mealData, context) => {
      const dateKeyStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
      if (context?.previousMeals) {
        queryClient.setQueryData(["meals", "date", dateKeyStr], context.previousMeals);
      }
      if (context?.isToday && context?.previousTodayMeals) {
        queryClient.setQueryData(["meals"], context.previousTodayMeals);
      }
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals"] }),
        queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
        queryClient.invalidateQueries({ queryKey: ["complianceScore"] })
      ]).catch(console.error);
    },
    onSuccess: (data) => {
      analytics.trackEvent('Custom Meal Logged', { calories: data.calories });
      haptics.success();
      setModalOpen(false);
      clearOldChats();
      addChatMessage({ id: Date.now().toString(), text: `✓ Logged Custom Meal: ${data.meal_text}`, isUser: false });
    }
  });"""

content = content.replace(old_mutation, new_mutation)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

