import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

old_success = """    onSuccess: (data, text) => {
      isSubmittingRef.current = false;
      setLoading(false);
      
      if (data._errorMessage) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage, input: text });
        setFailedMealError(data._errorMessage);
        setFailedMealText(null);
      } else if (data.confidence && data.confidence < 80) {
        analytics.trackEvent('AI Parse Failure', { error: 'Low confidence', input: text });
        setFailedMealText(text);
        setFailedMealError(null);
      } else {
        setRetryCount(0);
        analytics.trackEvent('AI Parse Success', { confidence: data.confidence, calories: data.calories });
        setPendingMeal({ text, data });
      }
    },"""

new_success = """    onSuccess: (data, text, variables, context) => {
      isSubmittingRef.current = false;
      setLoading(false);
      
      // Calculate costs
      let cost = 0;
      if (data.provider === 'gemini') cost = 0.0001;
      else if (data.provider === 'groq') cost = 0.00005;
      else if (data.provider === 'mistral') cost = 0.00002;

      const eventData = {
        source: data.source || 'unknown',
        provider: data.provider || 'none',
        latency: data._latency || 0,
        fallbackCount: data.fallbackCount || 0,
        confidence: data.confidence || 0,
        estimatedCost: cost,
        hitRateType: data.source // cache, rule_engine, ai
      };

      if (data._errorMessage) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage, input: text });
        setFailedMealError(data._errorMessage);
        setFailedMealText(null);
      } else if (data.confidence && data.confidence < 80) {
        analytics.trackEvent('AI Parse Failure', { error: 'Low confidence', input: text });
        setFailedMealText(text);
        setFailedMealError(null);
      } else {
        setRetryCount(0);
        
        analytics.trackEvent('Meal Parse Analytics', eventData);
        analytics.trackEvent('AI Parse Success', { confidence: data.confidence, calories: data.calories });
        
        setPendingMeal({ text, data });
      }
    },"""

content = content.replace(old_success, new_success)

old_mutation = """            const responseBody = await response.json();
            aiResponseDuration = Date.now() - edgeStart;"""

new_mutation = """            const responseBody = await response.json();
            aiResponseDuration = Date.now() - edgeStart;
            responseBody._latency = aiResponseDuration;"""

content = content.replace(old_mutation, new_mutation)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
