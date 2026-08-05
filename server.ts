import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------------------
// Knowledge Base & Normalization
// ----------------------------------------------------------------------------

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);


// ----------------------------------------------------------------------------
// LRU Memory Cache
// ----------------------------------------------------------------------------
const memoryCache = new Map<string, any>();
const MAX_CACHE_SIZE = 1000;

// ----------------------------------------------------------------------------
// Phase 8: Rate Limit Protection
// ----------------------------------------------------------------------------
interface ProviderState {
  healthy: boolean;
  cooldownUntil: number;
  lastFailure: string;
  error429Count: number;
}

const providerStatus: Record<string, ProviderState> = {
  gemini: { healthy: true, cooldownUntil: 0, lastFailure: '', error429Count: 0 },
  groq: { healthy: true, cooldownUntil: 0, lastFailure: '', error429Count: 0 },
  mistral: { healthy: true, cooldownUntil: 0, lastFailure: '', error429Count: 0 }
};

function updateProviderHealth() {
  const now = Date.now();
  for (const p of Object.keys(providerStatus)) {
    if (!providerStatus[p].healthy && now > providerStatus[p].cooldownUntil) {
      providerStatus[p].healthy = true;
      providerStatus[p].error429Count = 0;
      console.log(`[Rate Limit] ${p} cooldown finished. Re-enabled as primary.`);
    }
  }
}

function handleProviderError(provider: string, err: any) {
  const status = err.status || 500;
  const message = (err.message || '').toLowerCase();
  
  const isTargetError = status === 429 || status === 500 || status === 408 || message.includes('timeout') || message.includes('network') || message.includes('429');
  
  providerStatus[provider].lastFailure = new Date().toISOString();
  
  if (isTargetError) {
    if (status === 429 || message.includes('429')) {
      providerStatus[provider].error429Count++;
    }
    providerStatus[provider].healthy = false;
    providerStatus[provider].cooldownUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    console.log(`[Rate Limit] ${provider} disabled for 5 minutes due to error: ${err.message}`);
  }
}

async function fetchWithRetry(provider: string, fetchFn: (prompt: string) => Promise<any>, prompt: string): Promise<any> {
  try {
    return await fetchFn(prompt);
  } catch (err: any) {
    console.error(`[Orchestrator] ${provider} failed first attempt: ${err.message}. Retrying once...`);
    try {
      return await fetchFn(prompt);
    } catch (retryErr: any) {
      console.error(`[Orchestrator] ${provider} retry failed: ${retryErr.message}.`);
      handleProviderError(provider, retryErr);
      throw retryErr;
    }
  }
}


const KnowledgeBase: Record<string, { calories: number, protein: number, fat: number, carbs: number, fiber: number, serving: string, perUnit?: boolean, unitWeight?: number }> = {
  "roti": { calories: 120, protein: 4, fat: 3, carbs: 20, fiber: 3, serving: "1 piece (40g)", perUnit: true, unitWeight: 40 },
  "rice": { calories: 130, protein: 3, fat: 0.5, carbs: 28, fiber: 0.4, serving: "100g (cooked)", perUnit: false },
  "dal": { calories: 150, protein: 8, fat: 4, carbs: 20, fiber: 8, serving: "1 bowl (200g)", perUnit: false },
  "paneer": { calories: 265, protein: 18, fat: 20, carbs: 3, fiber: 0, serving: "100g", perUnit: false },
  "milk": { calories: 60, protein: 3.2, fat: 3, carbs: 5, fiber: 0, serving: "100ml", perUnit: false },
  "egg": { calories: 70, protein: 6, fat: 5, carbs: 0.5, fiber: 0, serving: "1 large (50g)", perUnit: true, unitWeight: 50 },
  "chicken breast": { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "chicken": { calories: 239, protein: 27, fat: 14, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "apple": { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, serving: "100g", perUnit: false },
  "banana": { calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6, serving: "100g", perUnit: false },
  "poha": { calories: 180, protein: 4, fat: 5, carbs: 30, fiber: 2, serving: "1 bowl (150g)", perUnit: false },
  "idli": { calories: 40, protein: 1.5, fat: 0.2, carbs: 8, fiber: 1, serving: "1 piece (40g)", perUnit: true, unitWeight: 40 },
  "dosa": { calories: 130, protein: 3, fat: 4, carbs: 20, fiber: 2, serving: "1 plain (100g)", perUnit: true, unitWeight: 100 },
  "sambar": { calories: 150, protein: 6, fat: 5, carbs: 20, fiber: 3, serving: "1 bowl", perUnit: false },
  "upma": { calories: 200, protein: 5, fat: 7, carbs: 28, fiber: 2, serving: "1 bowl", perUnit: false },
  "oats": { calories: 389, protein: 16.9, fat: 6.9, carbs: 66, fiber: 10.6, serving: "100g", perUnit: false },
  "rajma": { calories: 140, protein: 8.7, fat: 0.5, carbs: 22.8, fiber: 6.4, serving: "100g", perUnit: false },
  "chole": { calories: 164, protein: 8.9, fat: 2.6, carbs: 27.4, fiber: 7.6, serving: "100g", perUnit: false },
  "soya": { calories: 345, protein: 52, fat: 0.5, carbs: 33, fiber: 13, serving: "100g", perUnit: false },
  "curd": { calories: 98, protein: 11, fat: 4.3, carbs: 3.4, fiber: 0, serving: "100g", perUnit: false },
  "bread": { calories: 75, protein: 2.5, fat: 1, carbs: 14, fiber: 1, serving: "1 slice (30g)", perUnit: true, unitWeight: 30 },
  "chana": { calories: 364, protein: 19, fat: 6, carbs: 61, fiber: 17, serving: "100g", perUnit: false },
  "sprouts": { calories: 30, protein: 3.8, fat: 0.2, carbs: 6, fiber: 1.8, serving: "100g", perUnit: false },
  "almonds": { calories: 579, protein: 21, fat: 50, carbs: 22, fiber: 12.5, serving: "100g", perUnit: false },
  "peanut butter": { calories: 588, protein: 25, fat: 50, carbs: 20, fiber: 6, serving: "100g", perUnit: false },
  "whey protein": { calories: 379, protein: 78, fat: 2, carbs: 7, fiber: 0, serving: "100g", perUnit: false },
  "sweet potato": { calories: 86, protein: 1.6, fat: 0.1, carbs: 20, fiber: 3, serving: "100g", perUnit: false },
  "potato": { calories: 77, protein: 2, fat: 0.1, carbs: 17, fiber: 2.2, serving: "100g", perUnit: false },
  "carrot": { calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8, serving: "100g", perUnit: false },
  "cucumber": { calories: 15, protein: 0.65, fat: 0.1, carbs: 3.6, fiber: 0.5, serving: "100g", perUnit: false },
  "tomato": { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2, serving: "100g", perUnit: false },
  "onion": { calories: 40, protein: 1.1, fat: 0.1, carbs: 9, fiber: 1.7, serving: "100g", perUnit: false },
  "spinach": { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2, serving: "100g", perUnit: false },
  "broccoli": { calories: 34, protein: 2.8, fat: 0.4, carbs: 6.6, fiber: 2.6, serving: "100g", perUnit: false },
  "fish": { calories: 206, protein: 22, fat: 12, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "mutton": { calories: 294, protein: 25, fat: 21, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "ghee": { calories: 900, protein: 0, fat: 100, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "butter": { calories: 717, protein: 0.8, fat: 81, carbs: 0.1, fiber: 0, serving: "100g", perUnit: false },
  "oil": { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0, serving: "100g", perUnit: false },
  "sugar": { calories: 387, protein: 0, fat: 0, carbs: 100, fiber: 0, serving: "100g", perUnit: false },
  "jaggery": { calories: 383, protein: 0.4, fat: 0.1, carbs: 98, fiber: 0, serving: "100g", perUnit: false },
  "honey": { calories: 304, protein: 0.3, fat: 0, carbs: 82, fiber: 0.2, serving: "100g", perUnit: false }
};

function normalizeInput(input: string): string {
  let s = input.toLowerCase().trim();
  s = s.replace(/[^a-z0-9\s\.]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  
  // Number words to digits
  const numWords: Record<string, string> = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'half': '0.5', 'a': '1', 'an': '1'
  };
  s = s.split(' ').map(word => numWords[word] || word).join(' ');

  s = s.replace(/(\d+)\s*(g|gm|gms|grams|gram)\b/g, '$1g');
  s = s.replace(/(\d+)\s*(ml|mls|milliliter|milliliters)\b/g, '$1ml');
  s = s.replace(/(\d+)\s*(pc|pcs|piece|pieces|pic|slice|slices)\b/g, '$1 piece');
  s = s.replace(/(\d+)\s*(bowl|bowls|katori|plate|plates)\b/g, '$1 bowl');
  s = s.replace(/(\d+)\s*(cup|cups)\b/g, '$1 cup');
  
  s = s.replace(/\b(chapatis?|chappatis?|chapathis?|phulkas?|rotis?)\b/g, "roti");
  s = s.replace(/\b(soyabeans?|soya chunks?|nutrela)\b/g, "soya");
  s = s.replace(/\b(paneer curry|paneer sabji|paneer sabzi|shahi paneer|matar paneer|kadai paneer)\b/g, "paneer");
  s = s.replace(/\b(egg curry|egg bhurji|anda bhurji|anda curry|andas?|eggs?)\b/g, "egg");
  s = s.replace(/\b(chawal|rices?)\b/g, "rice");
  s = s.replace(/\b(dudh|milks?)\b/g, "milk");
  s = s.replace(/\b(apples?|seb)\b/g, "apple");
  s = s.replace(/\b(bananas?|kelas?|kela)\b/g, "banana");
  s = s.replace(/\b(dals?|daal)\b/g, "dal");
  s = s.replace(/\b(curd|dahi|yogurt|yoghurt)\b/g, "curd");
  s = s.replace(/\b(breads?)\b/g, "bread");
  s = s.replace(/\b(chanas?|chickpeas?|garbanzo beans?)\b/g, "chana");
  s = s.replace(/\b(sprouts?|moong sprouts?)\b/g, "sprouts");
  
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Phase 4: Knowledge Engine - Data is in KnowledgeBase
// Phase 5: Rule Engine - Deterministic calculations based on known nutrition
function applyRuleEngine(normalizedText: string) {
  const parts = normalizedText.split(/\s+(?:and|\+|&|,)\s+/);
  let totalCalories = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0, totalFiber = 0;
  const foodsDetected: string[] = [];
  
  for (const part of parts) {
    const match = part.match(/^(?:(\d+(?:\.\d+)?)\s*(g|ml|bowl|piece|cup)?\s*(?:of\s+)?)?(.+)$/);
    if (!match) return null;
    
    const quantityStr = match[1];
    const quantity = quantityStr ? parseFloat(quantityStr) : 1;
    const unit = match[2];
    const food = match[3].trim();
    
    const kbInfo = KnowledgeBase[food];
    if (!kbInfo) return null;
    
    let multiplier = 0;
    if (kbInfo.perUnit) {
      if (!unit || unit === 'piece') multiplier = quantity;
      else if (unit === 'g') multiplier = quantity / (kbInfo.unitWeight || 50);
    } else {
      if (unit === 'g' || unit === 'ml') multiplier = quantity / 100;
      else if (unit === 'bowl' || unit === 'cup') multiplier = quantity * 2; 
      else if (!unit) multiplier = quantity; 
    }
    
    if (multiplier === 0) return null;
    
    totalCalories += kbInfo.calories * multiplier;
    totalProtein += kbInfo.protein * multiplier;
    totalFat += kbInfo.fat * multiplier;
    totalCarbs += kbInfo.carbs * multiplier;
    totalFiber += kbInfo.fiber * multiplier;
    foodsDetected.push(`${quantityStr || 1}${unit ? ' ' + unit : ''} ${food}`.trim());
  }
  
  return {
    calories: totalCalories,
    protein: totalProtein,
    fat: totalFat,
    carbs: totalCarbs,
    fiber: totalFiber,
    confidence: 100,
    foods_detected: foodsDetected,
    coaching_tip: `Logged directly from verified knowledge base (${Math.round(totalCalories)} kcal, ${totalProtein}g protein).`
  };
}

// ----------------------------------------------------------------------------
// AI API Clients
// ----------------------------------------------------------------------------
const systemPrompt = `You are a precise nutrition expert. Parse the meal.
Generate structured JSON only.
Format:
{
  "calories": number,
  "protein": number,
  "fat": number,
  "carbs": number,
  "fiber": number,
  "confidence": number,
  "foods_detected": string[],
  "coaching_tip": string
}`;

async function fetchGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error(`Gemini failed: ${res.status}`);
  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Empty Gemini response");
  return JSON.parse(content);
}

async function fetchGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");
  
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });
  if (!res.ok) throw new Error(`Groq failed: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty Groq response");
  return JSON.parse(content);
}

async function fetchMistral(prompt: string) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("Missing MISTRAL_API_KEY");
  
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });
  if (!res.ok) throw new Error(`Mistral failed: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty Mistral response");
  return JSON.parse(content);
}

export const app = express();
const PORT = process.env.PORT || 3000;

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.options("*", cors({ origin: true, credentials: true }));

  // AI Orchestrator API
  app.all('/api/parse-meal', async (req, res) => {
    try {
      const payload = req.method === 'GET' ? req.query : req.body;
      const { text, mealType, remainingCalories, remainingProtein, userGoal } = payload;
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

        let fallbackCount = 0;
        for (const p of providers) {
          if (providerStatus[p.name].healthy) {
             console.log(`[Orchestrator] Attempting ${p.name}...`);
             try {
               finalResult = await fetchWithRetry(p.name, p.fn, prompt);
               finalResult.source = 'ai';
               finalResult.provider = p.name;
               finalResult.fallbackCount = fallbackCount;
               break; // Success
             } catch (e) {
               console.error(`[Orchestrator] ${p.name} exhausted. Falling back to next...`);
               fallbackCount++;
             }
          } else {
             console.log(`[Rate Limit] Skipping ${p.name} as it is in cooldown.`);
             fallbackCount++;
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
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    })();
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
