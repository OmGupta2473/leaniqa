// SETUP: Before deploying, run:
//   supabase secrets set GEMINI_API_KEY=your_key --project-ref YOUR_REF
//   supabase functions deploy generate-weekly-report --project-ref YOUR_REF
// For local dev: add GEMINI_API_KEY=your_key to supabase/functions/.env
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI, Type } from "npm:@google/genai"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const apiKey = Deno.env.get("GEMINI_API_KEY");
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is not set. Check supabase/functions/.env for local dev, or Supabase Dashboard > Edge Functions > Secrets for production.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  let userId = 'anonymous';

  let bodyData: any = {};
  try {
    bodyData = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const { metrics, weights, meals } = bodyData;

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error("Unauthorized");
    }
    userId = user.id;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    let isPremium = false
    if (sub && (sub.plan === 'beta_pro' || sub.plan === 'pro') && sub.status === 'active') {
      if (!sub.beta_expires_at || new Date(sub.beta_expires_at) > new Date()) {
        isPremium = true
      }
    }

    if (!isPremium) {
      return new Response(JSON.stringify({ error: "PRO_REQUIRED" }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const endpoint = 'generate-weekly-report'
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

    if (!ai) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    let attempts = 0;
    let data = null;
    let lastError = null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    while (attempts < 3 && !data) {
      try {
        attempts++;
        const aiStart = Date.now();

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

        const aiLatency = Date.now() - aiStart;
        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          user_id: userId,
          endpoint: endpoint,
          ai_duration_ms: aiLatency,
          attempts: attempts
        }));

        data = JSON.parse(response.text || '{}');
        clearTimeout(timeoutId);
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          console.error("AI Request timed out");
          break;
        }
        if (attempts >= 3) {
          console.error("Gemini failed after 3 attempts", err);
          break;
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 500));
      }
    }

    if (!data) {
      throw lastError || new Error("AI parsing failed completely");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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
      user_id: userId,
      endpoint: "generate-weekly-report",
      message: "AI failed or internal error, falling back",
      error: error.message
    }));

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
  } finally {
     console.log(JSON.stringify({
       level: "info",
       request_id: requestId,
       user_id: userId,
       latency_ms: Date.now() - startTime
     }));
  }
})
