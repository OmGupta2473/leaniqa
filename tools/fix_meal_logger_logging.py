import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

delete_mutation = r'  const deleteMealMutation = useMutation\(\{.*?onSettled: \(\) => \{.*?\n  \}\);\n\n  const handleDeleteMeal'

new_delete_mutation = """  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      console.group('Delete Meal Audit: ' + id);
      console.log('Meal Selected:', id);
      console.log('Delete Request sent to Database');
      await mealService.deleteMeal(id);
      console.log('Database Delete Response: Success');
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["meals", "today"] });
      const previousMeals = queryClient.getQueryData<any[]>(["meals", "today"]);
      
      const newMeals = previousMeals ? previousMeals.filter((m: any) => m.id !== id) : [];
      
      queryClient.setQueryData(["meals", "today"], newMeals);
      
      console.log('Remaining Meals:', newMeals.length);
      const newKcal = newMeals.reduce((s, m) => s + m.calories, 0);
      const newPro = newMeals.reduce((s, m) => s + m.protein, 0);
      console.log('Recalculated Daily Totals:', { calories: newKcal, protein: newPro });
      
      return { previousMeals };
    },
    onError: (err, id, context) => {
      console.error('Delete failed, rolling back:', err);
      console.groupEnd();
      if (context?.previousMeals) {
        queryClient.setQueryData(["meals", "today"], context.previousMeals);
      }
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals", "today"] }),
        queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
        complianceService.updateTodayScore().then(() => {
          console.log('Updated Dashboard & Progress Rings');
          return Promise.all([
            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] })
          ])
        }).catch(console.error)
      ]).then(() => {
        console.log('Updated History & Reports');
        console.groupEnd();
      });
    }
  });

  const handleDeleteMeal"""

content = re.sub(delete_mutation, new_delete_mutation, content, flags=re.DOTALL)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

