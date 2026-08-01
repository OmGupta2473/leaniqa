import sys

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

target = """    onError: (err: any, variables) => {
      isSubmittingRef.current = false;
      console.error('[parseMealMutation] onError fired:', err);
      const errorMessage = typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err);
      analytics.trackEvent('AI Parse Failure', { error: errorMessage, type: 'mutation_error' });
      setFailedMealText(variables);
      setLoading(false);
    }"""

replacement = """    onError: (err: any, variables) => {
      isSubmittingRef.current = false;
      console.error('[parseMealMutation] onError fired:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err instanceof Error) errorMessage = err.message;
      else if (typeof err === 'string') errorMessage = err;
      
      analytics.trackEvent('AI Parse Failure', { error: errorMessage, type: 'mutation_error' });
      setFailedMealError(errorMessage);
      setFailedMealText(null);
      setLoading(false);
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found!")
