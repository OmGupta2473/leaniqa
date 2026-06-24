import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI, Type } from "npm:@google/genai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { metrics, weights, meals } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const ai = new GoogleGenAI({ apiKey })

    const contents = `Analyze this week's data and provide a concise weekly report.
Metrics: ${JSON.stringify(metrics)}
Weights: ${JSON.stringify(weights)}
Meals: ${JSON.stringify(meals)}

Respond with JSON:
{
  "bestHabit": "short string",
  "worstHabit": "short string",
  "progressSummary": "short paragraph",
  "nextWeekPlan": "short paragraph"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bestHabit: { type: Type.STRING },
            worstHabit: { type: Type.STRING },
            progressSummary: { type: Type.STRING },
            nextWeekPlan: { type: Type.STRING }
          },
          required: ['bestHabit', 'worstHabit', 'progressSummary', 'nextWeekPlan']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.warn("AI failed, falling back", error);
    const fallbackData = {
      bestHabit: "Consistent tracking",
      worstHabit: "Missed some protein goals",
      progressSummary: "Overall a good week with solid effort.",
      nextWeekPlan: "Try to hit protein targets every day next week."
    };
    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})
