import { readFileSync, writeFileSync } from 'fs';

const file = 'supabase/functions/parse-meal/index.ts';
let code = readFileSync(file, 'utf8');

// I will just rewrite the whole file because it's easier to ensure it has pristine structured logging.
const fullCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------
interface ParseContext {
  originalText: string;
  normalizedText: string;
  mealType?: string;
  remainingCalories?: number;
  remainingProtein?: number;
  userGoal?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  requestId: string;
}

interface MealResult {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence: number;
  foods_detected: string[];
  coaching_tip: string;
}

const MealSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  confidence: z.number().min(0).max(100),
  foods_detected: z.array(z.string()),
  coaching_tip: z.string(),
});

interface MealParser {
  parse(context: ParseContext): Promise<MealResult | null>;
}

// ----------------------------------------------------------------------------
// Logging Utility
// ----------------------------------------------------------------------------
function logStage(requestId: string, stage: string, message: string, data: any = {}, level: "info" | "warn" | "error" = "info") {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    request_id: requestId,
    stage,
    message,
    ...data
  };
  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// ----------------------------------------------------------------------------
// Parsers
// ----------------------------------------------------------------------------
class GroqParser implements MealParser {
  async parse(context: ParseContext): Promise<MealResult | null> {
    if (!context.groqApiKey) {
      logStage(context.requestId, "GroqParser", "GROQ_API_KEY is missing from environment", {}, "error");
      throw new Error("Server configuration error: GROQ_API_KEY is not configured.");
    }
    
    logStage(context.requestId, "GroqParser", "Groq API Key verified present", { keyLength: context.groqApiKey.length });

    const prompt = \`You are a precise nutrition expert for Indian and international foods. Analyze this meal: "\${context.originalText}". Meal type: \${context.mealType || 'unspecified'}. The user has \${context.remainingCalories ?? 'unknown'} kcal remaining today and needs \${context.remainingProtein ?? 'unknown'}g more protein. User's goal: \${context.userGoal || 'maintenance'}.
Instructions:
1. Identify each food item and its exact quantity from the text. Never default to 100g unless explicitly specified in grams.
2. Apply quantity scaling strictly. Final nutrition MUST be: Serving Nutrition * Quantity.
3. Standard conversions: 1 scoop whey = 25g protein, 1 egg = 50g, 1 almond = 1.2g, 1 medium banana, 1 bowl sprouts, 1 cup rice, 1 roti = 40g, dal bowl = 200g, sabzi = 150g.
4. Confidence: 95-100 for named items with quantities, 80-94 for named items without quantities, 60-79 for ambiguous descriptions.
5. Coaching tip: Generate personalized recommendations based on the user's remaining daily targets and goal.
   - If protein is low, suggest high-protein foods.
   - If calories are almost exhausted, recommend low-calorie protein sources.
   - If both targets are nearly achieved, acknowledge good progress.
   - Keep it concise, natural, and context-aware.
Generate structured JSON only. Never generate conversational text or markdown blocks.
Format:
{
  "calories": number,
  "protein": number,
  "fat": number,
  "carbs": number,
  "confidence": number,
  "foods_detected": string[],
  "coaching_tip": string
}\`;

    const requestBody = {
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1
    };

    logStage(context.requestId, "GroqParser", "Constructed Groq request", { 
      model: requestBody.model, 
      promptLength: prompt.length 
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const fetchStart = Date.now();
    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${context.groqApiKey}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      logStage(context.requestId, "GroqParser", "Fetch to Groq failed", { error: fetchErr.message || String(fetchErr) }, "error");
      throw new Error(\`Groq API Network Error: \${fetchErr.message || String(fetchErr)}\`);
    }

    clearTimeout(timeoutId);
    logStage(context.requestId, "GroqParser", "Received Groq response", { 
      status: res.status, 
      statusText: res.statusText, 
      latencyMs: Date.now() - fetchStart 
    });

    if (!res.ok) {
      const errText = await res.text();
      logStage(context.requestId, "GroqParser", "Groq returned non-OK status", { status: res.status, errText }, "error");
      throw new Error(\`Groq API Error \${res.status}: \${errText}\`);
    }

    let json;
    try {
      json = await res.json();
    } catch (parseErr: any) {
      logStage(context.requestId, "GroqParser", "Failed to parse Groq response as JSON (top level)", { error: parseErr.message }, "error");
      throw new Error(\`Failed to parse Groq response body as JSON: \${parseErr.message}\`);
    }

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      logStage(context.requestId, "GroqParser", "Groq response missing content", { response: JSON.stringify(json) }, "error");
      throw new Error("Groq API returned empty or malformed content");
    }

    logStage(context.requestId, "GroqParser", "Raw content received from Groq", { contentPreview: content.substring(0, 150) + (content.length > 150 ? "..." : "") });

    let parsedContent;
    try {
      const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        parsedContent = JSON.parse(content);
      }
    } catch (e: any) {
      logStage(context.requestId, "GroqParser", "Failed to parse JSON string inside Groq content", { error: e.message, rawContent: content }, "error");
      throw new Error("Groq generated invalid JSON: " + e.message);
    }

    let validatedData;
    try {
      validatedData = MealSchema.parse(parsedContent);
    } catch (zodErr: any) {
      logStage(context.requestId, "GroqParser", "Zod validation failed", { error: zodErr.errors || zodErr.message, parsedContent }, "error");
      throw new Error(\`Validation Error: \${JSON.stringify(zodErr.errors || zodErr.message)}\`);
    }

    logStage(context.requestId, "GroqParser", "Groq parsing succeeded", { confidence: validatedData.confidence });
    return validatedData;
  }
}

// ----------------------------------------------------------------------------
// Nutrition Validation
// ----------------------------------------------------------------------------
class NutritionValidator {
  validate(requestId: string, data: MealResult): MealResult {
    if (data.protein < 0) data.protein = 0;
    if (data.fat < 0) data.fat = 0;
    if (data.carbs < 0) data.carbs = 0;
    
    const macroCalories = (data.protein * 4) + (data.carbs * 4) + (data.fat * 9);
    if (macroCalories > data.calories * 1.5 || macroCalories < data.calories * 0.5) {
      logStage(requestId, "NutritionValidation", "Macros do not match calories, adjusting calories", { 
        oldCalories: data.calories, 
        macroCalories: Math.round(macroCalories) 
      }, "warn");
      data.calories = Math.round(macroCalories);
    }
    
    if (data.calories > 10000 || data.protein > 500 || data.fat > 500 || data.carbs > 1000) {
      logStage(requestId, "NutritionValidation", "Extremely high macros detected", { data }, "error");
      throw new Error("Parsed nutrition values exceed reasonable limits");
    }
    
    return data;
  }
}

const memoryCache = new Map<string, MealResult>();

// ----------------------------------------------------------------------------
// Main Handler
// ----------------------------------------------------------------------------
serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  logStage(requestId, "Initialization", "Incoming parse-meal request");

  try {
    // 1. Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStage(requestId, "Authentication", "Missing Authorization header", {}, "error");
      throw new Error("Unauthorized");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logStage(requestId, "Environment", "Supabase environment variables missing", {}, "warn");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logStage(requestId, "Authentication", "Invalid token or user not found", { error: authError }, "error");
      throw new Error("Unauthorized");
    }

    logStage(requestId, "Authentication", "Authenticated successfully", { userId: user.id });

    // 2. Read Payload
    let body;
    try {
      body = await req.json();
    } catch (e: any) {
      logStage(requestId, "Payload", "Failed to parse request JSON body", { error: e.message }, "error");
      throw new Error("Invalid JSON body in request");
    }

    const { text, mealType, remainingCalories, remainingProtein, userGoal } = body;
    if (!text || typeof text !== "string" || text.trim() === "") {
      logStage(requestId, "Payload", "Missing or invalid 'text' parameter", { body }, "error");
      throw new Error("Missing 'text' parameter");
    }

    logStage(requestId, "Payload", "Received payload", {
      textLength: text.length,
      mealType,
      remainingCalories,
      remainingProtein,
      userGoal
    });

    // 3. Environment Variables (Check)
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    logStage(requestId, "Environment", "Checked Groq API Key", { 
      hasGroqKey: !!groqApiKey,
      groqKeyLength: groqApiKey ? groqApiKey.length : 0
    });

    const context: ParseContext = {
      originalText: text,
      normalizedText: text.toLowerCase().trim().replace(/\\s+/g, ' '),
      mealType,
      remainingCalories,
      remainingProtein,
      userGoal,
      groqApiKey,
      requestId
    };

    // 4. Run Groq Parser (Since Groq migration is requested)
    logStage(requestId, "Execution", "Starting GroqParser");
    const parser = new GroqParser();
    let data: MealResult;
    try {
      const result = await parser.parse(context);
      if (!result) throw new Error("Parser returned null unexpectedly");
      data = result;
    } catch (parseErr: any) {
      logStage(requestId, "Execution", "GroqParser failed", { error: parseErr.message || String(parseErr) }, "error");
      throw new Error(\`Groq Parsing Failed: \${parseErr.message || String(parseErr)}\`);
    }

    // 5. Nutrition Validation
    logStage(requestId, "Validation", "Starting Nutrition Validation");
    const validator = new NutritionValidator();
    data = validator.validate(requestId, data);
    logStage(requestId, "Validation", "Nutrition Validation passed");

    // 6. Persistence (Save to meal_parse_cache)
    try {
      const { error: dbError } = await supabase.from('meal_parse_cache').insert({
        normalized_text: context.normalizedText,
        meal_type: mealType || 'unspecified',
        result: data
      });
      if (dbError) {
        logStage(requestId, "Persistence", "Failed to save to cache table", { error: dbError }, "warn");
      } else {
        logStage(requestId, "Persistence", "Successfully saved to cache table");
      }
    } catch (dbEx: any) {
      logStage(requestId, "Persistence", "Exception while saving to cache table", { error: dbEx.message }, "warn");
    }

    // 7. Final Response
    logStage(requestId, "FinalResponse", "Returning successfully", { latencyMs: Date.now() - startTime });
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    const isUnauthorized = error.message === "Unauthorized";
    const statusCode = isUnauthorized ? 401 : (error.message?.includes("Timeout") ? 504 : 500);
    
    logStage(requestId, "Error", "Function failed", { error: error.message || String(error), stack: error.stack }, "error");
    
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode
    });
  }
});
`;

writeFileSync(file, fullCode);
console.log("Edge Function fully rewritten with structured logging.");
