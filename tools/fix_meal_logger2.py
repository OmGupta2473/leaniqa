import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# 1. Add deleteMealMutation
add_mutation_pattern = r'  const addMealMutation = useMutation\(\{'

delete_mutation = """  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Delete Request for id:', id);
      await mealService.deleteMeal(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["meals", "today"] });
      const previousMeals = queryClient.getQueryData(["meals", "today"]);
      
      // Optimistic update
      queryClient.setQueryData(["meals", "today"], (old: any) => {
        if (!old) return [];
        return old.filter((m: any) => m.id !== id);
      });
      
      return { previousMeals };
    },
    onError: (err, id, context) => {
      console.error('Delete failed, rolling back:', err);
      if (context?.previousMeals) {
        queryClient.setQueryData(["meals", "today"], context.previousMeals);
      }
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals", "today"] }),
        queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
        complianceService.updateTodayScore().then(() => 
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] })
          ])
        ).catch(console.error)
      ]);
    }
  });

  const handleDeleteMeal = (id: string) => {
    deleteMealMutation.mutate(id);
  };

  const addMealMutation = useMutation({"""

content = content.replace('  const addMealMutation = useMutation({', delete_mutation)

# 2. Add onDelete to the MealSlotRows
slot_rows_pattern = r'<MealSlotRow slot="breakfast".*?\n.*?<MealSlotRow slot="lunch".*?\n.*?<MealSlotRow slot="dinner".*?\n'

new_slot_rows = """        <MealSlotRow slot="breakfast" icon={<Sunrise size={14} />} label="Breakfast" timeRange="6 am – 12 pm" meals={breakfastMeals} onDelete={handleDeleteMeal} />
        <MealSlotRow slot="lunch" icon={<Sun size={14} />} label="Lunch" timeRange="12 pm – 6 pm" meals={lunchMeals} onDelete={handleDeleteMeal} />
        <MealSlotRow slot="dinner" icon={<Moon size={14} />} label="Dinner" timeRange="6 pm – 10 pm" meals={dinnerMeals} onDelete={handleDeleteMeal} />\n"""

content = re.sub(slot_rows_pattern, new_slot_rows, content)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

