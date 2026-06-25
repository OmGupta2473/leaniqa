import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI, Type } from "npm:@google/genai"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || 'http://localhost:5173'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MealSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  confidence: z.number(),
  foods_detected: z.array(z.string()),
  coaching_tip: z.string().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let text = "Unknown";

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const endpoint = 'parse-meal'
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .gte('created_at', twentyFourHoursAgo)

    if (count !== null && count >= 50) {
      return new Response(JSON.stringify({ error: "Daily limit reached. Upgrade to Pro for unlimited logging." }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    await supabase.from('api_usage').insert({ user_id: user.id, endpoint })

    const body = await req.json();
    text = body.text;
    const remainingCalories = body.remainingCalories;
    const remainingProtein = body.remainingProtein;
    const mealType = body.mealType;
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const ai = new GoogleGenAI({ apiKey })

    let attempts = 0;
    let success = false;
    let data = null;

    while (attempts < 3 && !success) {
      try {
        attempts++;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analyze this meal description: "${text}". Provide a reasonable estimate for macros. Use Indian food context where applicable. Provide your confidence level (0-100) and an array of detected food items.`,
          config: {
            responseMimeType: 'application/json',
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
                  items: { type: Type.STRING }
                }
              },
              required: ['calories', 'protein', 'fat', 'carbs', 'confidence', 'foods_detected']
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        
        let coaching_tip = "Good job logging your meal!";
        if (remainingCalories !== undefined && remainingProtein !== undefined && mealType !== undefined) {
           const tipResponse = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `The user just ate: ${parsed.foods_detected?.join(', ') || text}. They have ${remainingCalories} kcal and ${remainingProtein}g protein left today. 
Suggest ONE specific next meal or snack using Indian food to help them hit their targets. 
Be direct: give a food name, quantity, and expected macros. Keep it under 2 sentences. 
If they're already at their targets, say they're on track and suggest staying light.
Tone: like a PT friend, never judgmental.`
           });
           coaching_tip = tipResponse.text || coaching_tip;
        }
        
        parsed.coaching_tip = coaching_tip;

        // Zod validation
        data = MealSchema.parse(parsed);
        success = true;
      } catch (err) {
        if (attempts >= 3) {
          console.error("Gemini failed after 3 attempts", err);
          throw err;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.warn("AI failed, falling back to basic DB estimate", error);
    
    // Deterministic Fallback Logic
    const normalizedText = text.toLowerCase();
    let calories = 300, protein = 10, fat = 10, carbs = 40;
    let detected = [text];

    const foodDb: Record<string, { calories: number, protein: number, fat: number, carbs: number }> = {
      'chicken': { calories: 250, protein: 30, fat: 10, carbs: 0 },
      'dal': { calories: 200, protein: 12, fat: 4, carbs: 30 },
      'chawal': { calories: 240, protein: 4, fat: 0, carbs: 53 },
      'rice': { calories: 240, protein: 4, fat: 0, carbs: 53 },
      'paneer': { calories: 350, protein: 20, fat: 28, carbs: 4 },
      'fish': { calories: 200, protein: 25, fat: 10, carbs: 0 },
      'idli': { calories: 150, protein: 4, fat: 0, carbs: 30 },
      'roti': { calories: 120, protein: 4, fat: 1, carbs: 25 },
      'egg': { calories: 140, protein: 12, fat: 10, carbs: 1 },
      'salad': { calories: 50, protein: 2, fat: 0, carbs: 10 }
    };

    let foundMatch = false;
    for (const [key, macros] of Object.entries(foodDb)) {
      if (normalizedText.includes(key)) {
        if (!foundMatch) {
          calories = 0; protein = 0; fat = 0; carbs = 0;
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
      coaching_tip: "Stay consistent with your portions to hit your goals."
    };
    
    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})
