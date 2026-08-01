import sys

with open('supabase/functions/parse-meal/index.ts', 'r') as f:
    content = f.read()

target = """    console.warn(JSON.stringify({
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
    });"""

replacement = """    console.error(JSON.stringify({
      level: "error",
      request_id: requestId,
      endpoint: "parse-meal",
      message: "AI meal parsing failed",
      error: error.message || String(error),
      stack: error.stack
    }));

    let statusCode = 500;
    if (error.message?.includes("Timeout") || error.name === 'AbortError') {
      statusCode = 504;
    } else if (error.message?.includes("Rate Limit Exceeded")) {
      statusCode = 429;
    }

    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error during meal parsing",
      details: String(error)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });"""

if target in content:
    content = content.replace(target, replacement)
    with open('supabase/functions/parse-meal/index.ts', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found!")
