import re

with open("server.ts", "r") as f:
    content = f.read()

# Patch Memory Cache hit
old_mem = """if (memoryCache.has(cacheKey)) {
        console.log(`[Orchestrator] Solved by Memory Cache`);
        return res.json({ ...memoryCache.get(cacheKey), source: 'cache' });
      }"""

new_mem = """if (memoryCache.has(cacheKey)) {
        console.log(`[Orchestrator] Solved by Memory Cache`);
        const cachedItem = memoryCache.get(cacheKey);
        cachedItem.usage_count = (cachedItem.usage_count || 0) + 1;
        cachedItem.last_used = new Date().toISOString();
        
        supabase.from('meal_parse_cache')
          .update({ result: cachedItem })
          .eq('normalized_text', normalizedText)
          .eq('meal_type', mealType || '')
          .then(({error}) => { if(error) console.error("[Orchestrator] Failed to update cache usage", error); });
          
        return res.json({ ...cachedItem, source: 'cache' });
      }"""

content = content.replace(old_mem, new_mem)

# Patch DB Cache hit
old_db = """if (cacheData && cacheData.result) {
          console.log(`[Orchestrator] Solved by DB Cache`);
          
          // Populate memory cache
          memoryCache.set(cacheKey, cacheData.result);
          if (memoryCache.size > MAX_CACHE_SIZE) {
            const firstKey = memoryCache.keys().next().value;
            if (firstKey) memoryCache.delete(firstKey);
          }
          
          return res.json({ ...cacheData.result, source: 'cache' });
        }"""

new_db = """if (cacheData && cacheData.result) {
          console.log(`[Orchestrator] Solved by DB Cache`);
          
          cacheData.result.usage_count = (cacheData.result.usage_count || 0) + 1;
          cacheData.result.last_used = new Date().toISOString();
          
          supabase.from('meal_parse_cache')
            .update({ result: cacheData.result })
            .eq('normalized_text', normalizedText)
            .eq('meal_type', mealType || '')
            .then(({error}) => { if(error) console.error("[Orchestrator] Failed to update DB cache usage", error); });
          
          // Populate memory cache
          memoryCache.set(cacheKey, cacheData.result);
          if (memoryCache.size > MAX_CACHE_SIZE) {
            const firstKey = memoryCache.keys().next().value;
            if (firstKey) memoryCache.delete(firstKey);
          }
          
          return res.json({ ...cacheData.result, source: 'cache' });
        }"""

content = content.replace(old_db, new_db)

with open("server.ts", "w") as f:
    f.write(content)
