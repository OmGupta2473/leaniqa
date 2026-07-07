/*
 LOCAL DEV SETUP — read this if AI is not working:
 
 1. Create file: supabase/functions/.env
    Contents:
      GEMINI_API_KEY=AIza...your_actual_key_here...
 
 2. Start Supabase locally (if not already running):
      supabase start
 
 3. Serve functions with the env file:
      supabase functions serve --env-file supabase/functions/.env
    (keep this running in a separate terminal)
 
 4. Your Vite dev server runs separately:
      npm run dev
 
 5. To check if the key is loaded: open Supabase local logs at
    http://localhost:54323 and look for has_gemini_key: true
    in the parse-meal function logs after sending a meal.
 
 PRODUCTION SETUP:
   supabase secrets set GEMINI_API_KEY=AIza... --project-ref YOUR_REF
   supabase functions deploy parse-meal --project-ref YOUR_REF
   supabase functions deploy generate-weekly-report --project-ref YOUR_REF
*/
// SETUP: Before deploying, run:
//   supabase secrets set GEMINI_API_KEY=your_key --project-ref YOUR_REF
//   supabase functions deploy parse-meal --project-ref YOUR_REF
// For local dev: add GEMINI_API_KEY=your_key to supabase/functions/.env
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MealSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  confidence: z.number(),
  foods_detected: z.array(z.string()),
  coaching_tip: z.string(),
});

const apiKey = Deno.env.get("GEMINI_API_KEY");
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is not set. Check supabase/functions/.env for local dev, or Supabase Dashboard > Edge Functions > Secrets for production.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

serve(async (req) => {
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
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }
    userId = user.id;

    console.log(JSON.stringify({
      level: "debug",
      request_id: requestId,
      has_gemini_key: !!apiKey,
      text_length: text?.length ?? 0,
    }));

    // Rate Limiting
    const endpoint = "parse-meal";
    const limit = parseInt(Deno.env.get("DAILY_AI_LIMIT") || "50", 10);
    const today = new Date().toISOString().split("T")[0]; // UTC date for consistency
    
    const { data: usageData, error: usageError } = await supabase
      .from("api_usage")
      .select("usage_count")
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)
      .eq("date", today)
      .maybeSingle();

    if (usageError) {
      console.warn(JSON.stringify({
        level: "warn",
        request_id: requestId,
        endpoint: endpoint,
        message: "Database Read Failure",
        error: usageError.message,
        release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
      }));
    }

    const currentUsage = usageData?.usage_count || 0;

    if (currentUsage >= limit) {
      console.warn(JSON.stringify({
        level: "warn",
        request_id: requestId,
        endpoint: endpoint,
        message: "Rate Limit Exceeded",
        used: currentUsage,
        limit: limit,
        release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
      }));
      
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);
      
      return new Response(
        JSON.stringify({
          error: "Daily AI limit reached",
          limit: limit,
          used: currentUsage,
          resets_at: tomorrow.toISOString(),
          _limitReached: true
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!ai) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI Logic (Single Call)
    let attempts = 0;
    let data = null;
    let lastError = null;
    let aiStart = Date.now();
    
    while (attempts < 3 && !data) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      try {
        attempts++;
        aiStart = Date.now();
        
        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          endpoint: endpoint,
          message: "AI Request Started",
          release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
        }));
        
        const contents = `You are a precise nutrition expert for Indian and international foods. Analyze this meal: "${text}". Meal type: ${mealType || 'unspecified'}. The user has ${remainingCalories ?? 'unknown'} kcal remaining today and needs ${remainingProtein ?? 'unknown'}g more protein. User's goal: ${userGoal}.
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

        const aiPromise = ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
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
        
        const response = await Promise.race([
          aiPromise,
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              reject(new DOMException("Timeout", "AbortError"));
            });
          })
        ]);

        const aiLatency = Date.now() - aiStart;
        
        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          endpoint: endpoint,
          ai_duration_ms: aiLatency,
          attempts: attempts
        }));

        const parsed = JSON.parse(response.text || "{}");
        data = MealSchema.parse(parsed);
        
        const { error: incrementError } = await supabase.rpc("increment_api_usage", {
          p_user_id: user.id,
          p_endpoint: endpoint,
          p_date: today
        });
        
        if (incrementError) {
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            endpoint: endpoint,
            message: "Database Write Failure",
            error: incrementError.message,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
        }
        
        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          endpoint: endpoint,
          message: "AI Request Succeeded",
          latency: aiLatency,
          release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
        }));
        
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          console.error("AI Request timed out");
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            endpoint: endpoint,
            message: "AI Request Failed",
            error: "Timeout",
            latency: Date.now() - aiStart,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
          break;
        }
        if (attempts >= 3) {
          console.error("Gemini failed after 3 attempts", err);
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            endpoint: endpoint,
            message: "AI Request Failed",
            error: err.message,
            latency: Date.now() - aiStart,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
          break;
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 500)); // Exponential backoff: 1s, 2s
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!data) {
      throw lastError || new Error("AI parsing failed completely");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.warn(JSON.stringify({
      level: "warn",
      request_id: requestId,
      endpoint: "parse-meal",
      message: "AI failed, falling back to basic DB estimate",
      error: error.message
    }));

    // Deterministic Fallback Logic
    const normalizedText = text.toLowerCase();
    let calories = 300,
      protein = 10,
      fat = 10,
      carbs = 40;
    let detected = [text];

    const foodDb: Record<
      string,
      { calories: number; protein: number; fat: number; carbs: number }
    > = {
      chicken: { calories: 250, protein: 30, fat: 10, carbs: 0 },
      dal: { calories: 200, protein: 12, fat: 4, carbs: 30 },
      chawal: { calories: 240, protein: 4, fat: 0, carbs: 53 },
      rice: { calories: 240, protein: 4, fat: 0, carbs: 53 },
      paneer: { calories: 350, protein: 20, fat: 28, carbs: 4 },
      fish: { calories: 200, protein: 25, fat: 10, carbs: 0 },
      idli: { calories: 150, protein: 4, fat: 0, carbs: 30 },
      roti: { calories: 120, protein: 4, fat: 1, carbs: 25 },
      egg: { calories: 72, protein: 6, fat: 5, carbs: 0.5 },
      salad: { calories: 50, protein: 2, fat: 0, carbs: 10 },
    };

    let foundMatch = false;
    for (const [key, macros] of Object.entries(foodDb)) {
      if (normalizedText.includes(key)) {
        if (!foundMatch) {
          calories = 0;
          protein = 0;
          fat = 0;
          carbs = 0;
          detected = [];
          foundMatch = true;
        }
        calories += macros.calories;
        protein += macros.protein;
        fat += macros.fat;
        carbs += macros.carbs;
        detected.push(key);
      }
    }

    const fallbackData = {
      calories,
      protein,
      fat,
      carbs,
      confidence: foundMatch ? 80 : 30,
      foods_detected: detected,
      coaching_tip: "Stay consistent with your portions to hit your goals.",
    };

    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } finally {
     console.log(JSON.stringify({
       level: "info",
       request_id: requestId,
       latency_ms: Date.now() - startTime
     }));
  }
});
