import re

with open("server.ts", "r") as f:
    content = f.read()

old_caching = """      // Validation & Caching rules
      const isValid = aiResult && typeof aiResult.calories === 'number' && typeof aiResult.protein === 'number' && Array.isArray(aiResult.foods_detected);
      const isConfident = typeof aiResult.confidence === 'number' && aiResult.confidence >= 80;

      if (isValid && isConfident) {
        // Save Cache
        aiResult.usage_count = 1;
        aiResult.last_used = new Date().toISOString();
        
        memoryCache.set(cacheKey, aiResult);
        if (memoryCache.size > MAX_CACHE_SIZE) {
          const firstKey = memoryCache.keys().next().value;
          if (firstKey) memoryCache.delete(firstKey);
        }
        
        try {
          await supabase.from('meal_parse_cache').insert({
            normalized_text: normalizedText,
            meal_type: mealType || '',
            result: aiResult
          });
        } catch (e) {
          console.error("[Orchestrator] Failed to save DB cache", e);
        }
      } else {
        console.log(`[Orchestrator] Skipping cache for result. Valid: ${isValid}, Confident: ${isConfident}`);
      }
      
      console.log(`[Orchestrator] Solved by AI (${aiProvider})`);

      return res.json({ ...aiResult, source: 'ai' });"""

new_caching = """      // Phase 9: Cache Learning
      const isValid = aiResult && typeof aiResult.calories === 'number' && typeof aiResult.protein === 'number' && Array.isArray(aiResult.foods_detected);
      const confidence = typeof aiResult.confidence === 'number' ? aiResult.confidence : 0;

      if (!isValid) {
        console.log(`[Orchestrator] Invalid AI result`);
        return res.status(500).json({ error: "Friendly Retry: We couldn't parse that meal right now. Could you be more specific or try again?" });
      }

      if (confidence < 80) {
        console.log(`[Orchestrator] Low confidence (${confidence} < 80). Rejecting.`);
        return res.status(500).json({ error: "Friendly Retry: We are not confident about this meal's nutrition. Could you be more specific or try again?" });
      }

      // 80+ confidence gets cached
      aiResult.usage_count = 1;
      aiResult.last_used = new Date().toISOString();
      if (confidence >= 80 && confidence <= 90) {
        aiResult.needs_review = true; // Review flag
      }

      memoryCache.set(cacheKey, aiResult);
      if (memoryCache.size > MAX_CACHE_SIZE) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
      }
      
      try {
        await supabase.from('meal_parse_cache').insert({
          normalized_text: normalizedText,
          meal_type: mealType || '',
          result: aiResult
        });
      } catch (e) {
        console.error("[Orchestrator] Failed to save DB cache", e);
      }
      
      console.log(`[Orchestrator] Solved by AI (${aiProvider}), Confidence: ${confidence}`);

      return res.json({ ...aiResult, source: 'ai' });"""

content = content.replace(old_caching, new_caching)

with open("server.ts", "w") as f:
    f.write(content)
