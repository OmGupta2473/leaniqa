import { z } from "npm:zod";

const MealSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  confidence: z.number().min(0).max(100),
  foods_detected: z.array(z.string()),
  coaching_tip: z.string(),
});

class GroqParser {
  async parse(context: any): Promise<any> {
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${context.groqApiKey}\`,
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
      const errText = await res.text();
      throw new Error(\`Groq API Error \${res.status}: \${errText}\`);
    }
    
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq API returned empty response");
    }
    
    console.log("RAW CONTENT FROM GROQ:\\n", content);

    // Let's try raw parse first to see if it was the JSON parse issue
    let parsed;
    try {
      parsed = JSON.parse(content);
      console.log("JSON.parse SUCCEEDED!");
    } catch (e) {
      console.log("JSON.parse FAILED!");
      const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    }
    
    try {
      const data = MealSchema.parse(parsed);
      console.log("Zod Validation SUCCEEDED!");
      return data;
    } catch (zodErr) {
      console.log("Zod Validation FAILED!", zodErr);
      throw zodErr;
    }
  }
}

async function run() {
  const parser = new GroqParser();
  try {
    await parser.parse({
      originalText: "2 eggs and a banana",
      mealType: "breakfast",
      remainingCalories: 1000,
      remainingProtein: 50,
      userGoal: "build muscle",
      groqApiKey: process.env.GROQ_API_KEY
    });
  } catch (e) {
    console.error(e);
  }
}
run();
