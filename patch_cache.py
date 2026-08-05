import re

with open("server.ts", "r") as f:
    content = f.read()

# Add memory cache definition
if "const memoryCache = new Map<string, any>();" not in content:
    init_code = """
// ----------------------------------------------------------------------------
// LRU Memory Cache
// ----------------------------------------------------------------------------
const memoryCache = new Map<string, any>();
const MAX_CACHE_SIZE = 1000;

"""
    content = content.replace('const KnowledgeBase:', init_code + 'const KnowledgeBase:')

# Add memory cache check in the endpoint
old_endpoint_start = "// Stage 1.5: Cache Check"
old_endpoint_end = "const kbResult = checkKnowledgeBase(normalizedText);"

new_endpoint = """// Stage 1: Memory Cache Check
      const cacheKey = `${normalizedText}_${mealType || ''}`;
      if (memoryCache.has(cacheKey)) {
        console.log(`[Orchestrator] Solved by Memory Cache`);
        return res.json({ ...memoryCache.get(cacheKey), source: 'cache' });
      }

      // Stage 1.5: DB Cache Check
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
          
          // Populate memory cache
          memoryCache.set(cacheKey, cacheData.result);
          if (memoryCache.size > MAX_CACHE_SIZE) {
            const firstKey = memoryCache.keys().next().value;
            if (firstKey) memoryCache.delete(firstKey);
          }
          
          return res.json({ ...cacheData.result, source: 'cache' });
        }
      } catch (e) {
        console.error("[Orchestrator] DB Cache check failed", e);
      }
      
      // Stage 2/3: Knowledge Engine & Rule Engine
      const kbResult = checkKnowledgeBase(normalizedText);"""

pattern = re.compile(re.escape(old_endpoint_start) + r'.*?' + re.escape(old_endpoint_end), re.DOTALL)
content = pattern.sub(lambda m: new_endpoint, content)

# Add memory cache save
old_save_start = "// Save Cache"
old_save_end = "console.log(`[Orchestrator] Solved by AI`);"

new_save = """// Save Cache
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
      
      console.log(`[Orchestrator] Solved by AI`);"""

pattern2 = re.compile(re.escape(old_save_start) + r'.*?' + re.escape(old_save_end), re.DOTALL)
content = pattern2.sub(lambda m: new_save, content)

with open("server.ts", "w") as f:
    f.write(content)
