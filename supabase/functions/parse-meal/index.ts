/* LOCAL DEV SETUP ... */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers
function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, baggage, sentry-trace",
  };
}

// Schemas
const MealSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  confidence: z.number(),
  foods_detected: z.array(z.string()),
  coaching_tip: z.string(),
});

type MealResult = z.infer<typeof MealSchema>;

export interface ParseContext {
  originalText: string;
  normalizedText: string;
  mealType: string;
  remainingCalories: number | string;
  remainingProtein: number | string;
  userGoal: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  requestId: string;
}

export interface MealParser {
  parse(context: ParseContext): Promise<MealResult | null>;
}

// ----------------------------------------------------------------------------
// Stage 1 - Normalization
// ----------------------------------------------------------------------------
function normalizeInput(input: string): string {
  // 1. Lowercase and trim
  let s = input.toLowerCase().trim();
  
  // 2. Remove punctuation (keep numbers, letters, spaces)
  s = s.replace(/[^\w\s\.]/g, ' ');
  
  // 3. Normalize multiple spaces
  s = s.replace(/\s+/g, ' ').trim();

  // 4. Normalize units and spacing (e.g., "100 g" -> "100g", "2 pcs" -> "2 piece")
  s = s.replace(/(\d+)\s*(g|gm|gms|grams|gram)\b/g, '$1g');
  s = s.replace(/(\d+)\s*(ml|mls|milliliter|milliliters)\b/g, '$1ml');
  s = s.replace(/(\d+)\s*(pc|pcs|piece|pieces|pic)\b/g, '$1 piece');
  s = s.replace(/(\d+)\s*(bowl|bowls|katori|plate|plates)\b/g, '$1 bowl');
  s = s.replace(/(\d+)\s*(cup|cups)\b/g, '$1 cup');

  // 5. Plurals & Aliases (Hindi/Hinglish)
  s = s.replace(/\b(chapatis?|chappatis?|phulkas?|rotis?)\b/g, "roti");
  s = s.replace(/\b(soyabeans?|soya chunks?|nutrela)\b/g, "soya");
  s = s.replace(/\b(paneer curry|paneer sabji|paneer sabzi|shahi paneer|matar paneer|kadai paneer)\b/g, "paneer");
  s = s.replace(/\b(egg curry|egg bhurji|anda bhurji|anda curry|andas?|eggs?)\b/g, "egg");
  s = s.replace(/\b(chawal|rices?)\b/g, "rice");
  s = s.replace(/\b(dudh|milks?)\b/g, "milk");
  s = s.replace(/\b(apples?|seb)\b/g, "apple");
  s = s.replace(/\b(bananas?|kelas?)\b/g, "banana");
  s = s.replace(/\b(dals?|daal)\b/g, "dal");
  
  // Clean up any double spaces created
  s = s.replace(/\s+/g, ' ').trim();
  
  return s;
}

// ----------------------------------------------------------------------------
// Stage 2 & 3 - Knowledge Base & Rule-Based Parser
// ----------------------------------------------------------------------------
const KnowledgeBase: Record<string, { calories: number, protein: number, fat: number, carbs: number, serving: string, perUnit?: boolean, unitWeight?: number }> = {
  "roti": { calories: 120, protein: 4, fat: 3, carbs: 20, serving: "1 piece (40g)", perUnit: true, unitWeight: 40 },
  "rice": { calories: 130, protein: 3, fat: 0.5, carbs: 28, serving: "100g (cooked)", perUnit: false },
  "dal": { calories: 150, protein: 8, fat: 4, carbs: 20, serving: "1 bowl (200g)", perUnit: false },
  "paneer": { calories: 265, protein: 18, fat: 20, carbs: 3, serving: "100g", perUnit: false },
  "milk": { calories: 60, protein: 3.2, fat: 3, carbs: 5, serving: "100ml", perUnit: false },
  "egg": { calories: 70, protein: 6, fat: 5, carbs: 0.5, serving: "1 large (50g)", perUnit: true, unitWeight: 50 },
  "chicken breast": { calories: 165, protein: 31, fat: 3.6, carbs: 0, serving: "100g", perUnit: false },
  "apple": { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, serving: "100g", perUnit: false },
  "banana": { calories: 89, protein: 1.1, fat: 0.3, carbs: 23, serving: "100g", perUnit: false },
  "poha": { calories: 180, protein: 4, fat: 5, carbs: 30, serving: "1 bowl (150g)", perUnit: false },
  "idli": { calories: 40, protein: 1.5, fat: 0.2, carbs: 8, serving: "1 piece (40g)", perUnit: true, unitWeight: 40 },
  "dosa": { calories: 130, protein: 3, fat: 4, carbs: 20, serving: "1 plain (100g)", perUnit: true, unitWeight: 100 },
  "sambar": { calories: 150, protein: 6, fat: 5, carbs: 20, serving: "1 bowl", perUnit: false },
  "upma": { calories: 200, protein: 5, fat: 7, carbs: 28, serving: "1 bowl", perUnit: false },
  "oats": { calories: 389, protein: 16.9, fat: 6.9, carbs: 66, serving: "100g", perUnit: false },
  "rajma": { calories: 140, protein: 8.7, fat: 0.5, carbs: 22.8, serving: "100g", perUnit: false },
  "chole": { calories: 164, protein: 8.9, fat: 2.6, carbs: 27.4, serving: "100g", perUnit: false },
  "soya": { calories: 345, protein: 52, fat: 0.5, carbs: 33, serving: "100g", perUnit: false },
};

class KnowledgeBaseParser implements MealParser {
  async parse(context: ParseContext): Promise<MealResult | null> {
    // Split combined inputs like "2 roti and 1 bowl dal" or "100g paneer + 2 roti"
    const parts = context.normalizedText.split(/\s+(?:and|\+|&|,)\s+/);
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    const foodsDetected: string[] = [];

    for (const part of parts) {
      // Optional quantity and unit
      const match = part.match(/^(?:(\d+(?:\.\d+)?)\s*(g|ml|bowl|piece|cup)?\s*(?:of\s+)?)?(.+)$/);
      if (!match) return null; // Let Groq handle unrecognized formats

      const quantityStr = match[1];
      const quantity = quantityStr ? parseFloat(quantityStr) : 1;
      const unit = match[2];
      const food = match[3].trim();
      
      const kbInfo = KnowledgeBase[food];
      if (!kbInfo) return null; // Let Groq handle unknown foods

      let multiplier = 0;
      if (kbInfo.perUnit) {
        if (!unit || unit === 'piece') multiplier = quantity;
        else if (unit === 'g') multiplier = quantity / (kbInfo.unitWeight || 50);
      } else {
        if (unit === 'g' || unit === 'ml') multiplier = quantity / 100;
        else if (unit === 'bowl' || unit === 'cup') multiplier = quantity;
        else if (!unit) multiplier = quantity; // Implicit 1 = 1 serving
      }
      
      if (multiplier <= 0 || multiplier >= 100) return null; // Let Groq handle edge cases

      totalCalories += kbInfo.calories * multiplier;
      totalProtein += kbInfo.protein * multiplier;
      totalFat += kbInfo.fat * multiplier;
      totalCarbs += kbInfo.carbs * multiplier;
      
      const detectedName = quantityStr ? `${quantityStr}${unit || ''} ${food}` : (kbInfo.perUnit ? `1 ${food}` : `1 serving ${food}`);
      foodsDetected.push(detectedName);
    }

    if (foodsDetected.length > 0) {
      console.log(`[parse-meal] KnowledgeBaseParser matched: ${foodsDetected.join(', ')}`);
      return {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        fat: Math.round(totalFat),
        carbs: Math.round(totalCarbs),
        confidence: 99,
        foods_detected: foodsDetected,
        coaching_tip: "Great, simple and tracked accurately!"
      };
    }
    
    return null;
  }
}

// ----------------------------------------------------------------------------
// Stage 4 & 5 - Groq AI & Confidence Evaluation
// ----------------------------------------------------------------------------
class GroqParser implements MealParser {
  async parse(context: ParseContext): Promise<MealResult | null> {
    if (!context.groqApiKey) return null;
    
    console.log(`[parse-meal] GroqParser started`);
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const prompt = `Analyze this meal: "${context.originalText}". 
Meal type: ${context.mealType}. 
Generate structured JSON only. Never generate conversational text or markdown blocks.
Format:
{
  "calories": number,
  "protein": number,
  "fat": number,
  "carbs": number,
  "confidence": number, // 0-100
  "foods_detected": string[],
  "coaching_tip": string
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${context.groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.1
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Groq Error: ${res.status}`);
        }
        
        const json = await res.json();
        const content = json.choices[0]?.message?.content;
        if (!content) return null;
        
        const parsed = JSON.parse(content);
        const data = MealSchema.parse(parsed);
        
        if (data.confidence >= 80) { // Slightly lower threshold to prevent unnecessary Gemini fallbacks
          console.log(`[parse-meal] GroqParser succeeded with confidence ${data.confidence}`);
          return data;
        } else {
          console.log(`[parse-meal] GroqParser low confidence (${data.confidence}), skipping`);
          return null; // Fallback
        }
      } catch (err: any) {
        console.error(`[parse-meal] GroqParser error on attempt ${attempt}:`, err.message || err);
        if (attempt >= maxAttempts) return null;
      }
    }
    return null;
  }
}

// ----------------------------------------------------------------------------
// Stage 6 - Gemini Fallback
// ----------------------------------------------------------------------------
class GeminiParser implements MealParser {
  async parse(context: ParseContext): Promise<MealResult | null> {
    if (!context.geminiApiKey) return null;
    
    console.log(`[parse-meal] GeminiParser started (Fallback)`);
    try {
      const ai = new GoogleGenAI({ apiKey: context.geminiApiKey });
      const prompt = `You are a precise nutrition expert for Indian and international foods. Analyze this meal: "${context.originalText}". Meal type: ${context.mealType || 'unspecified'}. The user has ${context.remainingCalories ?? 'unknown'} kcal remaining today and needs ${context.remainingProtein ?? 'unknown'}g more protein. User's goal: ${context.userGoal}.
Instructions:
1. Identify each food item and its exact quantity from the text. Never default to 100g unless explicitly specified in grams.
2. Apply quantity scaling strictly. Final nutrition MUST be: Serving Nutrition * Quantity.
3. Standard conversions: 1 egg = 50g, 1 almond = 1.2g, 1 medium banana, 1 bowl sprouts, 1 cup rice, 1 roti = 40g, dal bowl = 200g, sabzi = 150g.
4. Confidence: 95-100 for named items with quantities, 80-94 for named items without quantities, 60-79 for ambiguous descriptions.
5. Coaching tip: Generate personalized recommendations based on the user's remaining daily targets and goal.
   - If protein is low, suggest high-protein foods.
   - If calories are almost exhausted, recommend low-calorie protein sources.
   - If both targets are nearly achieved, acknowledge good progress.
   - Keep it concise, natural, and context-aware.
Respond with valid JSON only.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              foods_detected: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              coaching_tip: { type: Type.STRING },
            },
            required: [
              "calories",
              "protein",
              "fat",
              "carbs",
              "confidence",
              "foods_detected",
              "coaching_tip"
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return MealSchema.parse(parsed);
    } catch (err) {
      console.error(`[parse-meal] GeminiParser error`, err);
      return null;
    }
  }
}

// ----------------------------------------------------------------------------
// Stage 7 - Nutrition Validation
// ----------------------------------------------------------------------------
class NutritionValidator {
  validate(data: MealResult): MealResult {
    // Validate calories
    if (data.calories < 0) data.calories = 0;
    if (data.calories > 10000) data.calories = 10000;
    
    // Validate macros against calories (roughly)
    const macroCalories = (data.protein * 4) + (data.carbs * 4) + (data.fat * 9);
    if (macroCalories > data.calories * 1.5 || macroCalories < data.calories * 0.5) {
      // Adjust calories if completely mismatched
      if (macroCalories > 0) {
        data.calories = Math.round(macroCalories);
      }
    }
    
    // Ensure no negative values
    if (data.protein < 0) data.protein = 0;
    if (data.fat < 0) data.fat = 0;
    if (data.carbs < 0) data.carbs = 0;
    
    return data;
  }
}

// ----------------------------------------------------------------------------
// Main Handler
// ----------------------------------------------------------------------------
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  let userId = 'anonymous';
  let body: any = {};

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const text = body.text || "Unknown";
  const remainingCalories = body.remainingCalories;
  const remainingProtein = body.remainingProtein;
  const mealType = body.mealType;
  const userGoal = body.userGoal || 'maintenance';

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");
    userId = user.id;

    // Rate Limiting
    const endpoint = "parse-meal";
    const limit = parseInt(Deno.env.get("DAILY_AI_LIMIT") || "50", 10);
    const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const today = istDate.toISOString().split("T")[0];
    
    const { data: usageData } = await supabase
      .from("api_usage")
      .select("usage_count")
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)
      .eq("date", today)
      .maybeSingle();

    const currentUsage = usageData?.usage_count || 0;
    if (currentUsage >= limit) {
      const istTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
      istTime.setUTCHours(24, 0, 0, 0);
      const resetsAt = new Date(istTime.getTime() - 5.5 * 60 * 60 * 1000);
      
      return new Response(
        JSON.stringify({
          error: "Daily AI limit reached", limit, used: currentUsage, resets_at: resetsAt.toISOString(), _limitReached: true
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Context
    const context: ParseContext = {
      originalText: text,
      normalizedText: normalizeInput(text),
      mealType,
      remainingCalories,
      remainingProtein,
      userGoal,
      groqApiKey: Deno.env.get("GROQ_API_KEY"),
      geminiApiKey: Deno.env.get("GEMINI_API_KEY"),
      requestId
    };

    // Stage 8 - Intelligent Caching (Optional, using Supabase table 'meal_parse_cache')
    // Fallback to in-memory for this instance
    const cacheKey = `${context.normalizedText}_${mealType}`;
    // In a real system, we'd query `meal_parse_cache` here. For simplicity, we'll try to query it.
    // We wrap it in a try-catch so it doesn't fail if the table doesn't exist.
    try {
      const { data: cacheData } = await supabase
        .from('meal_parse_cache')
        .select('*')
        .eq('normalized_text', context.normalizedText)
        .eq('meal_type', mealType)
        .maybeSingle();
        
      if (cacheData && cacheData.result) {
        console.log(`[parse-meal] Cache hit for: ${context.normalizedText}`);
        return new Response(JSON.stringify(cacheData.result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      // ignore missing cache table
    }

    let data: MealResult | null = null;
    let parserUsed = '';

    // Pipeline Execution
    const parsers = [
      { name: 'KnowledgeBase', parser: new KnowledgeBaseParser() },
      { name: 'Groq', parser: new GroqParser() },
      { name: 'Gemini', parser: new GeminiParser() }
    ];

    for (const { name, parser } of parsers) {
      const pStart = Date.now();
      data = await parser.parse(context);
      
      console.log(JSON.stringify({
        level: "info",
        request_id: requestId,
        stage: name,
        latency_ms: Date.now() - pStart,
        success: !!data
      }));

      if (data) {
        parserUsed = name;
        break;
      }
    }

    if (!data) {
      throw new Error("All AI parsing stages failed completely");
    }

    // Stage 7 - Nutrition Validation
    const validator = new NutritionValidator();
    data = validator.validate(data);

    // Save to Cache
    try {
      await supabase.from('meal_parse_cache').insert({
        normalized_text: context.normalizedText,
        meal_type: mealType,
        result: data
      });
    } catch (e) {
      // ignore
    }

    // Increment Usage
    if (parserUsed === 'Groq' || parserUsed === 'Gemini') {
      const { error: incrementError } = await supabase.rpc("increment_api_usage", {
        p_user_id: user.id,
        p_endpoint: endpoint,
        p_date: today
      });
      if (incrementError) {
        console.error("Database Write Failure:", incrementError.message);
      }
    }

    console.log(JSON.stringify({
      level: "info",
      request_id: requestId,
      endpoint,
      message: "Parsing Pipeline Succeeded",
      parser: parserUsed,
      total_latency: Date.now() - startTime
    }));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.error(JSON.stringify({
      level: "error", request_id: requestId, endpoint: "parse-meal",
      message: "AI meal parsing failed", error: error.message || String(error)
    }));

    let statusCode = 500;
    if (error.message?.includes("Timeout") || error.name === 'AbortError') statusCode = 504;
    else if (error.message?.includes("Rate Limit")) statusCode = 429;

    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error during meal parsing" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
