import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace the AI provider try/catch block and caching logic
old_ai_start = "let aiResult;"
old_ai_end = "console.log(`[Orchestrator] Solved by AI`);"

new_ai = """let aiResult;
      let aiProvider = 'none';
      
      // Gemini Fallback Logic
      try {
        console.log(`[Orchestrator] Attempting Gemini...`);
        aiResult = await fetchGemini(prompt);
        aiProvider = 'gemini';
      } catch (geminiErr: any) {
        console.error(`[Orchestrator] Gemini failed: ${geminiErr.message}. Retrying...`);
        try {
          aiResult = await fetchGemini(prompt);
          aiProvider = 'gemini';
        } catch (geminiRetryErr: any) {
          console.error(`[Orchestrator] Gemini retry failed: ${geminiRetryErr.message}. Falling back to Groq...`);
          try {
            aiResult = await fetchGroq(prompt);
            aiProvider = 'groq';
          } catch (groqErr: any) {
            console.error(`[Orchestrator] Groq failed: ${groqErr.message}. Retrying...`);
            try {
              aiResult = await fetchGroq(prompt);
              aiProvider = 'groq';
            } catch (groqRetryErr: any) {
              console.error(`[Orchestrator] Groq retry failed: ${groqRetryErr.message}. Falling back to Mistral...`);
              try {
                aiResult = await fetchMistral(prompt);
                aiProvider = 'mistral';
              } catch (mistralErr: any) {
                console.error(`[Orchestrator] Mistral failed: ${mistralErr.message}. All AI engines exhausted.`);
                return res.status(500).json({ error: "Friendly Retry: We couldn't parse that meal right now. Could you be more specific or try again?" });
              }
            }
          }
        }
      }
      
      aiResult.ai_provider_used = aiProvider;
      aiResult.created_time = new Date().toISOString();
      
      // Validation & Caching rules
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
      
      console.log(`[Orchestrator] Solved by AI (${aiProvider})`);"""

pattern = re.compile(re.escape(old_ai_start) + r'.*?' + re.escape(old_ai_end), re.DOTALL)
content = pattern.sub(lambda m: new_ai, content)

with open("server.ts", "w") as f:
    f.write(content)
