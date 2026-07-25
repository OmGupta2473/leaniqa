import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# Fix optimistic update for deleting
old_del_1 = """      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
        await queryClient.cancelQueries({ queryKey: ["meals", "today"] });
        const previousMeals = queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr]);
        const previousTodayMeals = queryClient.getQueryData<any[]>(["meals", "today"]);
        if (previousMeals) {
          queryClient.setQueryData(["meals", "date", dateKeyStr], previousMeals.filter((m: any) => m.id !== id));
        }
        if (previousTodayMeals) {
          queryClient.setQueryData(["meals", "today"], previousTodayMeals.filter((m: any) => m.id !== id));
        }
        return { previousMeals, previousTodayMeals };
      },
      onError: (err, newMeal, context: any) => {
        if (context?.previousMeals) {
          queryClient.setQueryData(["meals", "date", dateKeyStr], context.previousMeals);
        }
        if (context?.previousTodayMeals) {
          queryClient.setQueryData(["meals", "today"], context.previousTodayMeals);
        }
      },"""

new_del_1 = """      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
        await queryClient.cancelQueries({ queryKey: ["meals"] });
        const previousMeals = queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr]);
        const previousAllMeals = queryClient.getQueryData<any[]>(["meals"]);
        if (previousMeals) {
          queryClient.setQueryData(["meals", "date", dateKeyStr], previousMeals.filter((m: any) => m.id !== id));
        }
        if (previousAllMeals) {
          queryClient.setQueryData(["meals"], previousAllMeals.filter((m: any) => m.id !== id));
        }
        return { previousMeals, previousAllMeals };
      },
      onError: (err, newMeal, context: any) => {
        if (context?.previousMeals) {
          queryClient.setQueryData(["meals", "date", dateKeyStr], context.previousMeals);
        }
        if (context?.previousAllMeals) {
          queryClient.setQueryData(["meals"], context.previousAllMeals);
        }
      },"""
content = content.replace(old_del_1, new_del_1)

# Fix optimistic update for adding
old_add_1 = """      onMutate: async (newMeal) => {
        const tempId = 'temp-' + Date.now();
        const mealWithTempId = { ...newMeal, id: tempId, meal_time: selectedDate.toISOString(), meal_slot: 'snack' };

        await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
        await queryClient.cancelQueries({ queryKey: ["meals", "today"] });

        const previousMeals = queryClient.getQueryData(["meals", "date", dateKeyStr]);
        const previousTodayMeals = queryClient.getQueryData(["meals", "today"]);

        if (previousMeals) {
          queryClient.setQueryData(["meals", "date", dateKeyStr], (old: any) => {
            return old ? [...old, mealWithTempId] : [mealWithTempId];
          });
        }
        if (previousTodayMeals) {
          queryClient.setQueryData(["meals", "today"], (old: any) => {
            return old ? [...old, mealWithTempId] : [mealWithTempId];
          });
        }

        return { previousMeals, previousTodayMeals };
      },
      onError: (err, newMeal, context: any) => {
        console.error('Failed to save meal', err);
        if (context?.previousMeals) {
          queryClient.setQueryData(["meals", "date", dateKeyStr], context.previousMeals);
        }
        if (context?.previousTodayMeals) {
          queryClient.setQueryData(["meals", "today"], context.previousTodayMeals);
        }
      },"""

new_add_1 = """      onMutate: async (newMeal) => {
        const tempId = 'temp-' + Date.now();
        const mealWithTempId = { ...newMeal, id: tempId, meal_time: selectedDate.toISOString(), meal_slot: 'snack' };

        await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
        await queryClient.cancelQueries({ queryKey: ["meals"] });

        const previousMeals = queryClient.getQueryData(["meals", "date", dateKeyStr]);
        const previousAllMeals = queryClient.getQueryData(["meals"]);

        if (previousMeals) {
          queryClient.setQueryData(["meals", "date", dateKeyStr], (old: any) => {
            return old ? [...old, mealWithTempId] : [mealWithTempId];
          });
        }
        if (previousAllMeals) {
          queryClient.setQueryData(["meals"], (old: any) => {
            return old ? [...old, mealWithTempId] : [mealWithTempId];
          });
        }

        return { previousMeals, previousAllMeals };
      },
      onError: (err, newMeal, context: any) => {
        console.error('Failed to save meal', err);
        if (context?.previousMeals) {
          queryClient.setQueryData(["meals", "date", dateKeyStr], context.previousMeals);
        }
        if (context?.previousAllMeals) {
          queryClient.setQueryData(["meals"], context.previousAllMeals);
        }
      },"""
content = content.replace(old_add_1, new_add_1)


with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)
