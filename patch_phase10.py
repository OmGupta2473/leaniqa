import re

with open("server.ts", "r") as f:
    content = f.read()

# We need to extract the logic inside app.post('/api/parse-meal')
# Let's find the start and end of the app.post route.

start_index = content.find("app.post('/api/parse-meal', async (req, res) => {")
end_index = content.find("  // Vite middleware for development")

original_route = content[start_index:end_index]

new_route = """app.post('/api/parse-meal', async (req, res) => {
    try {
      const { text, mealType, remainingCalories, remainingProtein, userGoal } = req.body;
      const normalizedText = normalizeInput(text);
      
      console.log(`[Orchestrator] Input: "${text}" -> "${normalizedText}"`);
      
      let finalResult: any = null;
      const cacheKey = `${normalizedText}_${mealType || ''}`;

      // Stage 1: Memory Cache Check
      if (memoryCache.has(cacheKey)) {
        console.log(`[Orchestrator] Solved by Memory Cache`);
        finalResult = memoryCache.get(cacheKey);
        finalResult.source = 'cache';
      }

      // Stage 1.5: DB Cache Check
      if (!finalResult) {
        try {
          const { data: cacheData } = await supabase
            .from('meal_parse_cache')
            .select('result')
            .eq('normalized_text', normalizedText)
            .eq('meal_type', mealType || '')
            .limit(1)
            .maybeSingle();
            
          if (cacheData && cacheData.result) {
            console.log(`[Orchestrator] Solved by DB Cache`);
            finalResult = cacheData.result;
            finalResult.source = 'cache';
          }
        } catch (e) {
          console.error("[Orchestrator] DB Cache check failed", e);
        }
      }
      
      // Phase 4 & 5: Knowledge Engine + Rule Engine
      if (!finalResult) {
        const ruleResult1 = applyRuleEngine(normalizedText);
        if (ruleResult1) {
          console.log(`[Orchestrator] Solved by Rule Engine (KB + Multiplier)`);
          finalResult = { ...ruleResult1, source: 'rule_engine' };
        }
      }

      // Stage 3: Rule Engine (Fallback Regex Matching)
      if (!finalResult) {
        const calMatch = normalizedText.match(/^(\d+)\s*(?:kcal|calories?)\s*(?:of|from)?\s*(.+)$/i) || 
                         normalizedText.match(/^(.+?)\s*(?:with|has|contains)?\s*(\d+)\s*(?:kcal|calories?)$/i);
                         
        if (calMatch) {
          const cals = parseInt(calMatch[1] || calMatch[2], 10);
          const itemName = (calMatch[2] || calMatch[1]).trim();
          if (!isNaN(cals) && itemName) {
            finalResult = {
              calories: cals, protein: 0, fat: 0, carbs: 0, fiber: 0,
              confidence: 90, foods_detected: [itemName],
              coaching_tip: `Quick log: ${cals} kcal from ${itemName}. Detailed macros (protein, carbs) aren't available for this entry.`,
              source: 'rule_engine'
            };
          }
        }
        
        const proteinMatch = normalizedText.match(/^(\d+)\s*(?:g|gm|grams)\s*protein\s*(?:from|shake|powder)?\s*(.+)?$/i) ||
                             normalizedText.match(/^(.+?)\s*(?:with|has|contains)?\s*(\d+)\s*(?:g|gm|grams)\s*protein$/i);
                             
        if (!finalResult && proteinMatch) {
          const p = parseInt(proteinMatch[1] || proteinMatch[2], 10);
          let itemName = "protein source";
          if (proteinMatch[1] && proteinMatch[2]) itemName = proteinMatch[2];
          else if (proteinMatch[2] && proteinMatch[1]) itemName = proteinMatch[1];
          
          if (!isNaN(p)) {
            finalResult = {
              calories: p * 4, protein: p, fat: 0, carbs: 0, fiber: 0,
              confidence: 85, foods_detected: [itemName.trim()],
              coaching_tip: `Quick log: ${p}g protein from ${itemName.trim()}.`,
              source: 'rule_engine'
            };
          }
        }
      }

      // Phase 6: AI Decision Layer & Phase 8: Rate Limit Protection
      if (!finalResult) {
        console.log(`[Orchestrator] AI Decision Layer routing to LLM for: "${normalizedText}"`);
        const prompt = `Analyze this meal: "${text}". Meal type: ${mealType || 'unspecified'}. Remaining today: ${remainingCalories ?? 'unknown'} kcal, ${remainingProtein ?? 'unknown'}g protein. Goal: ${userGoal || 'maintenance'}.`;
        
        updateProviderHealth();
        
        const providers = [
          { name: 'gemini', fn: fetchGemini },
          { name: 'groq', fn: fetchGroq },
          { name: 'mistral', fn: fetchMistral }
        ];

        for (const p of providers) {
          if (providerStatus[p.name].healthy) {
             console.log(`[Orchestrator] Attempting ${p.name}...`);
             try {
               finalResult = await fetchWithRetry(p.name, p.fn, prompt);
               finalResult.source = 'ai';
               break; // Success
             } catch (e) {
               console.error(`[Orchestrator] ${p.name} exhausted. Falling back to next...`);
             }
          } else {
             console.log(`[Rate Limit] Skipping ${p.name} as it is in cooldown.`);
          }
        }
      }

      // Phase 10: Unified Save Pipeline
      if (!finalResult) {
         console.error(`[Orchestrator] All engines exhausted. No result.`);
         return res.status(500).json({ error: "Friendly Retry: We couldn't parse that meal right now. Could you be more specific or try again?" });
      }

      // Phase 9: Cache Learning Rules applied to unified result
      const isValid = finalResult && typeof finalResult.calories === 'number' && typeof finalResult.protein === 'number' && Array.isArray(finalResult.foods_detected);
      const confidenceRaw = typeof finalResult.confidence === 'number' ? finalResult.confidence : 0;
      const confidence = confidenceRaw <= 1 && confidenceRaw > 0 ? confidenceRaw * 100 : confidenceRaw;

      if (!isValid) {
        console.log(`[Orchestrator] Invalid result`);
        return res.status(500).json({ error: "Friendly Retry: We couldn't parse that meal right now. Could you be more specific or try again?" });
      }

      if (confidence < 80) {
        console.log(`[Orchestrator] Low confidence (${confidence} < 80). Rejecting.`);
        return res.status(500).json({ error: "Friendly Retry: We are not confident about this meal's nutrition. Could you be more specific or try again?" });
      }

      // 80+ confidence gets cached
      if (finalResult.source === 'cache') {
        finalResult.usage_count = (finalResult.usage_count || 0) + 1;
        finalResult.last_used = new Date().toISOString();
        
        supabase.from('meal_parse_cache')
          .update({ result: finalResult })
          .eq('normalized_text', normalizedText)
          .eq('meal_type', mealType || '')
          .then(({error}) => { if(error) console.error("[Orchestrator] Failed to update DB cache usage", error); });
      } else {
        finalResult.usage_count = 1;
        finalResult.last_used = new Date().toISOString();
        if (confidence >= 80 && confidence <= 90) {
          finalResult.needs_review = true; // Review flag
        }
        
        try {
          await supabase.from('meal_parse_cache').insert({
            normalized_text: normalizedText,
            meal_type: mealType || '',
            result: finalResult
          });
        } catch (e) {
          console.error("[Orchestrator] Failed to save DB cache", e);
        }
      }

      // Memory cache populate
      memoryCache.set(cacheKey, finalResult);
      if (memoryCache.size > MAX_CACHE_SIZE) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
      }
      
      console.log(`[Orchestrator] Successfully returning unified result (Source: ${finalResult.source}, Confidence: ${confidence})`);
      return res.json(finalResult);
      
    } catch (err: any) {
      console.error("[Orchestrator] Error:", err);
      res.status(500).json({ error: "Friendly Retry: Something went wrong parsing that meal." });
    }
  });
"""

content = content.replace(original_route, new_route)

with open("server.ts", "w") as f:
    f.write(content)
