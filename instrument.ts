import { readFileSync, writeFileSync } from 'fs';

const file = 'edge_backup.ts';
let code = readFileSync(file, 'utf8');

// 1. Add detailed logging to GroqParser
const groqClassRegex = /class GroqParser implements MealParser \{[\s\S]*?async parse\(context: ParseContext\): Promise<MealResult \| null> \{([\s\S]*?)\}\n\}/;
const groqMatch = code.match(groqClassRegex);

if (groqMatch) {
    const originalBody = groqMatch[1];
    
    // We will manually reconstruct GroqParser to be fully instrumented
    const newGroqParser = `class GroqParser implements MealParser {
  async parse(context: ParseContext): Promise<MealResult | null> {
    console.log(JSON.stringify({ level: "info", stage: "GroqParser", message: "Starting Groq API request", request_id: context.requestId }));
    
    if (!context.groqApiKey) {
      console.error(JSON.stringify({ level: "error", stage: "GroqParser", message: "GROQ_API_KEY is missing", request_id: context.requestId }));
      throw new Error("Server configuration error: GROQ_API_KEY is not configured.");
    }
    
    try {
      const prompt = \`You are a precise nutrition expert for Indian and international foods. Analyze this meal: "\${context.originalText}". Meal type: \${context.mealType || 'unspecified'}. The user has \${context.remainingCalories ?? 'unknown'} kcal remaining today and needs \${context.remainingProtein ?? 'unknown'}g more protein. User's goal: \${context.userGoal}.
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

      console.log(JSON.stringify({ level: "info", stage: "GroqParser_Request", request_payload: { model: "llama-3.3-70b-versatile", prompt_length: prompt.length }, request_id: context.requestId }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const fetchStart = Date.now();
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${context.groqApiKey}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Restoring original versatile model just in case
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.1
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log(JSON.stringify({ level: "info", stage: "GroqParser_Response", status: res.status, latency_ms: Date.now() - fetchStart, request_id: context.requestId }));

      if (!res.ok) {
        const errText = await res.text();
        console.error(JSON.stringify({ level: "error", stage: "GroqParser_HTTP", status: res.status, body: errText, request_id: context.requestId }));
        throw new Error(\`Groq API Error \${res.status}: \${errText}\`);
      }
      
      const json = await res.json();
      console.log(JSON.stringify({ level: "info", stage: "GroqParser_JSON", json_keys: Object.keys(json), request_id: context.requestId }));

      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        console.error(JSON.stringify({ level: "error", stage: "GroqParser_Content", json: JSON.stringify(json), request_id: context.requestId }));
        throw new Error("Groq API returned empty response");
      }
      
      console.log(JSON.stringify({ level: "info", stage: "GroqParser_RawContent", contentPreview: content.substring(0, 100), request_id: context.requestId }));

      let parsed;
      try {
        const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            parsed = JSON.parse(content);
        }
      } catch (e: any) {
          console.error(JSON.stringify({ level: "error", stage: "GroqParser_Parse", error: e.message, rawContent: content, request_id: context.requestId }));
          throw new Error("Failed to parse Groq JSON: " + content);
      }

      let data;
      try {
        data = MealSchema.parse(parsed);
      } catch (zodErr: any) {
        console.error(JSON.stringify({ level: "error", stage: "GroqParser_Zod", error: zodErr.message, parsed_object: parsed, request_id: context.requestId }));
        throw zodErr;
      }
      
      console.log(JSON.stringify({ level: "info", stage: "GroqParser_Success", confidence: data.confidence, request_id: context.requestId }));
      return data;
    } catch (err: any) {
      console.error(JSON.stringify({ level: "error", stage: "GroqParser_Exception", error: err.message || String(err), request_id: context.requestId }));
      throw err;
    }
  }
}`;

    code = code.replace(groqClassRegex, newGroqParser);
}

// 2. Add detailed logging to main pipeline error handling
const pipelineRegex = /if \(!data\) \{\s*throw new Error\("AI parsing failed\. Details: " \+ lastError\);\s*\}/;
if (code.match(pipelineRegex)) {
    code = code.replace(pipelineRegex, `if (!data) {
      console.error(JSON.stringify({ level: "error", stage: "Pipeline", message: "All parsers exhausted", lastError, request_id: requestId }));
      throw new Error("AI parsing failed. Details: " + lastError);
    }`);
} else {
    // maybe it says "All AI parsing stages failed completely"
    const oldPipelineRegex = /if \(!data\) \{\s*throw new Error\("All AI parsing stages failed completely"\);\s*\}/;
    code = code.replace(oldPipelineRegex, `if (!data) {
      console.error(JSON.stringify({ level: "error", stage: "Pipeline", message: "All parsers exhausted", lastError: typeof lastError !== 'undefined' ? lastError : 'unknown', request_id: requestId }));
      throw new Error("All AI parsing stages failed completely. Last error: " + (typeof lastError !== 'undefined' ? lastError : 'unknown'));
    }`);
}

writeFileSync('supabase/functions/parse-meal/index.ts', code);
