import re

with open("server.ts", "r") as f:
    content = f.read()

# Add Supabase import
if "import { createClient } from" not in content:
    content = content.replace('import cors from "cors";', 'import cors from "cors";\nimport { createClient } from "@supabase/supabase-js";')

# Initialize Supabase
if "const supabase = createClient(" not in content:
    init_code = """
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
"""
    content = content.replace('const KnowledgeBase:', init_code + '\nconst KnowledgeBase:')

# Add Cache logic in the endpoint
old_endpoint_start = "const normalizedText = normalizeInput(text);"
old_endpoint_end = "const prompt ="

new_endpoint = """const normalizedText = normalizeInput(text);
      
      console.log(`[Orchestrator] Input: "${text}" -> "${normalizedText}"`);
      
      // Stage 1.5: Cache Check
      try {
        const { data: cacheData } = await supabase
          .from('meal_parse_cache')
          .select('result')
          .eq('normalized_text', normalizedText)
          .eq('meal_type', mealType || '')
          .limit(1)
          .maybeSingle();
          
        if (cacheData && cacheData.result) {
          console.log(`[Orchestrator] Solved by Cache`);
          return res.json({ ...cacheData.result, source: 'cache' });
        }
      } catch (e) {
        console.error("[Orchestrator] Cache check failed", e);
      }
      
      // Stage 2/3: Knowledge Engine & Rule Engine
      const kbResult = checkKnowledgeBase(normalizedText);
      if (kbResult) {
        console.log(`[Orchestrator] Solved by KnowledgeBase`);
        return res.json({ ...kbResult, source: 'knowledge_base' });
      }

      console.log(`[Orchestrator] Needs AI for: "${normalizedText}"`);
      const prompt ="""

pattern = re.compile(re.escape(old_endpoint_start) + r'.*?' + re.escape(old_endpoint_end), re.DOTALL)
content = pattern.sub(new_endpoint, content)

# Add Save Cache logic
old_save_start = "console.log(`[Orchestrator] Solved by AI`);"
new_save = """
      // Save Cache
      try {
        await supabase.from('meal_parse_cache').insert({
          normalized_text: normalizedText,
          meal_type: mealType || '',
          result: aiResult
        });
      } catch (e) {
        console.error("[Orchestrator] Failed to save cache", e);
      }
      
      console.log(`[Orchestrator] Solved by AI`);
"""
content = content.replace(old_save_start, new_save)

with open("server.ts", "w") as f:
    f.write(content)
