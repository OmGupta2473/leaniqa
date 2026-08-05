import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

old_confirm = """  const confirmMealMutation = useMutation({
    mutationFn: async ({ text, data }: { text: string, data: any }) => {
      await mealService.addMeal({ 
        meal_text: text, 
        calories: Math.round(data.calories), 
        protein: Math.round(data.protein), 
        fat: Math.round(data.fat), 
        carbs: Math.round(data.carbs), 
        meal_time: getMealTime().toISOString(), 
        tip: data.foods_detected?.join(', ') || text, 
        meal_slot: selectedMealSlot || undefined 
      });
      return { text, data };
    },
    onSuccess: ({ text, data }) => {
      setPendingMeal(null);
      haptics.success();
      haptics.success();
      const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
      
      let responseText = `✓ Logged: ${foodsDetected}`;
      if (data?._fromCache) {
        responseText = `✓ Logged: ${foodsDetected}`;
      }
      
      addChatMessage({ role: 'ai', text: responseText, data });
      setTimeout(() => {
        setModalOpen(false);
      }, 800);
    },
    onError: (err: any) => {
      console.error('[confirmMealMutation] onError:', err);
      addChatMessage({ role: 'ai', text: `⚠️ Failed to save meal. Please try again.` });
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals"] }),
        queryClient.invalidateQueries({ queryKey: ["userStreak"] }),
        queryClient.invalidateQueries({ queryKey: ["userAwards"] }),
        complianceService.recalculateDayScore(selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0')).then(() => 
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] })
          ])
        )
      ]).catch(console.error);
    }
  });"""

new_confirm = """  const confirmMealMutation = useMutation({
    mutationFn: async ({ text, data, source }: { text: string, data: any, source?: 'manual' | 'ai' }) => {
      const mealData = { 
        meal_text: text, 
        calories: Math.round(data.calories), 
        protein: Math.round(data.protein), 
        fat: Math.round(data.fat), 
        carbs: Math.round(data.carbs), 
        fiber: data.fiber ? Math.round(data.fiber) : undefined,
        meal_time: getMealTime().toISOString(), 
        tip: data.tip || data.foods_detected?.join(', ') || text, 
        meal_slot: data.meal_slot || selectedMealSlot || undefined,
        meal_source: source || 'ai'
      };

      if (typeof window !== 'undefined' && !navigator.onLine) {
        devLog('Offline: queueing add meal');
        const { offlineSyncService } = await import('@/shared/services/offlineSyncService');
        offlineSyncService.enqueue({ type: 'ADD_MEAL', payload: mealData });
        return { text, data, source, _localOnly: true };
      }

      await mealService.addMeal(mealData as any);
      return { text, data, source };
    },
    onMutate: async ({ text, data, source }) => {
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
      
      const newMealObj = { 
        id: 'temp-' + Date.now(), 
        meal_text: text,
        calories: Math.round(data.calories),
        protein: Math.round(data.protein),
        fat: Math.round(data.fat),
        carbs: Math.round(data.carbs),
        fiber: data.fiber ? Math.round(data.fiber) : undefined,
        meal_slot: data.meal_slot || selectedMealSlot || undefined,
        meal_source: source || 'ai',
        _localOnly: true 
      };

      if (previousMeals) {
        queryClient.setQueryData(["meals", "date", dateKeyStr], [...previousMeals, newMealObj]);
      }
      if (isToday && previousTodayMeals) {
        queryClient.setQueryData(["meals"], [...previousTodayMeals, newMealObj]);
      }

      return { previousMeals, previousTodayMeals, isToday, dateKeyStr };
    },
    onSuccess: ({ text, data, source }) => {
      setPendingMeal(null);
      haptics.success();
      haptics.success();
      
      if (source === 'manual') {
        analytics.trackEvent('Custom Meal Logged', { calories: data.calories });
        setIsCustomMealModalOpen(false);
        addChatMessage({ role: 'ai', text: `✓ Logged Custom Meal: ${text}` });
      } else {
        const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
        let responseText = `✓ Logged: ${foodsDetected}`;
        if (data?._fromCache) {
          responseText = `✓ Logged: ${foodsDetected}`;
        }
        addChatMessage({ role: 'ai', text: responseText, data });
      }
      
      setTimeout(() => {
        setModalOpen(false);
      }, 800);
    },
    onError: (err: any, variables, context: any) => {
      console.error('[confirmMealMutation] onError:', err);
      addChatMessage({ role: 'ai', text: `⚠️ Failed to save meal. Please try again.` });
      
      if (context?.dateKeyStr && context?.previousMeals) {
        queryClient.setQueryData(["meals", "date", context.dateKeyStr], context.previousMeals);
      }
      if (context?.isToday && context?.previousTodayMeals) {
        queryClient.setQueryData(["meals"], context.previousTodayMeals);
      }
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals"] }),
        queryClient.invalidateQueries({ queryKey: ["userStreak"] }),
        queryClient.invalidateQueries({ queryKey: ["userAwards"] }),
        complianceService.recalculateDayScore(selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0')).then(() => 
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] })
          ])
        )
      ]).catch(console.error);
    }
  });"""

content = content.replace(old_confirm, new_confirm)

# Now remove customMealMutation
# Find customMealMutation ...
old_custom = """  const customMealMutation = useMutation({
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
      setIsCustomMealModalOpen(false);
      addChatMessage({ role: 'ai', text: `✓ Logged Custom Meal: ${data.meal_text}` });
      setTimeout(() => {
        setModalOpen(false);
      }, 800);
    }
  });

  const handleCustomMealSave = (mealData: any) => {
    customMealMutation.mutate(mealData);
  };"""

new_custom = """  const handleCustomMealSave = (mealData: any) => {
    confirmMealMutation.mutate({
      text: mealData.meal_text,
      data: {
        calories: mealData.calories,
        protein: mealData.protein,
        fat: mealData.fat,
        carbs: mealData.carbs,
        fiber: mealData.fiber,
        meal_slot: mealData.meal_slot,
        tip: mealData.tip
      },
      source: 'manual'
    });
  };"""

content = content.replace(old_custom, new_custom)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

