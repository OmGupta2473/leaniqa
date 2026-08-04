import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  app.post("/api/parse-meal", async (req, res) => {
    try {
      const { text, mealType, remainingCalories, remainingProtein, userGoal } = req.body;
      const groqApiKey = process.env.GROQ_API_KEY;
      
      if (!groqApiKey) {
        return res.status(500).json({ error: "GROQ_API_KEY is not configured on the server." });
      }

      const prompt = `You are a precise nutrition expert for Indian and international foods. Analyze this meal: "${text}". Meal type: ${mealType || 'unspecified'}. The user has ${remainingCalories ?? 'unknown'} kcal remaining today and needs ${remainingProtein ?? 'unknown'}g more protein. User's goal: ${userGoal || 'maintenance'}.
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
}`;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        throw new Error(`Groq API Error ${groqRes.status}: ${errText}`);
      }

      const json = await groqRes.json();
      const content = json.choices[0]?.message?.content;
      
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
        } else {
            parsed = JSON.parse(content);
        }
      } catch (e) {
          throw new Error("Failed to parse Groq JSON: " + content);
      }

      return res.json(parsed);
    } catch (error: any) {
      console.error("[parse-meal] API Route Error:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
