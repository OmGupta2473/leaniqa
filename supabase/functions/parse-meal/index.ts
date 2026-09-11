import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, baggage, sentry-trace",
  };
}

const MealSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  fiber: z.number(),
  confidence: z.number(),
  foods_detected: z.array(z.string()),
  coaching_tip: z.string(),
});

type MealResult = z.infer<typeof MealSchema>;
type QuantityUnit = "g" | "ml" | "piece" | "slice" | "bowl" | "cup" | "scoop";
type ServingUnit = Exclude<QuantityUnit, "g" | "ml">;

interface ParseContext {
  originalText: string;
  normalizedText: string;
  mealType: string;
  remainingCalories: number | string;
  remainingProtein: number | string;
  userGoal: string;
  geminiApiKey?: string;
  requestId: string;
}

interface MealParser {
  parse(context: ParseContext): Promise<MealResult | null>;
}

class MealAiError extends Error {
  constructor(
    readonly code: "missing_secret" | "timeout" | "provider_error" | "invalid_response",
    readonly status: 502 | 503 | 504,
  ) {
    super(code);
  }
}

const numberWords: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6",
  seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", half: "0.5",
};

function normalizeInput(input: string): string {
  let normalized = input.toLowerCase().trim();
  normalized = normalized.replace(/[,+&]/g, " and ");
  normalized = normalized.replace(/[^a-z0-9\s.]/g, " ");
  normalized = normalized.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half)\b/g, (word) => numberWords[word]);
  normalized = normalized.replace(/\s+/g, " ").trim();

  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams)\b/g, "$1g");
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*(ml|mls|milliliter|milliliters)\b/g, "$1ml");
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*(pc|pcs|piece|pieces)\b/g, "$1 piece");
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*(slice|slices)\b/g, "$1 slice");
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*(bowl|bowls|katori|katoris)\b/g, "$1 bowl");
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*(cup|cups)\b/g, "$1 cup");
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*(scoop|scoops)\b/g, "$1 scoop");
  normalized = normalized.replace(/(\d+)\s*x\s+(?=[a-z])/g, "$1 ");

  // Only aliases with the same preparation and nutrition basis are normalized.
  normalized = normalized.replace(/\b(chapatis?|chappatis?|chapathis?|phulkas?|rotis?)\b/g, "roti");
  normalized = normalized.replace(/\b(soya chunks?|nutrela)\b/g, "soya chunks");
  normalized = normalized.replace(/\b(boiled eggs?|eggs?|andas?)\b/g, "egg");
  normalized = normalized.replace(/\b(chicken breasts?)\b/g, "chicken breast");
  normalized = normalized.replace(/\b(cooked rice|chawal|rices?)\b/g, "rice");
  normalized = normalized.replace(/\b(dudh|milks?)\b/g, "milk");
  normalized = normalized.replace(/\b(apples?|seb)\b/g, "apple");
  normalized = normalized.replace(/\b(bananas?|kelas?|kela)\b/g, "banana");
  normalized = normalized.replace(/\b(dals?|daal)\b/g, "dal");
  normalized = normalized.replace(/\b(dahi|yogurt|yoghurt)\b/g, "curd");
  normalized = normalized.replace(/\b(almonds?)\b/g, "almond");
  normalized = normalized.replace(/\b(idlis?)\b/g, "idli");
  normalized = normalized.replace(/\b(plain dosas?|dosas?)\b/g, "plain dosa");
  normalized = normalized.replace(/\b(sambars?)\b/g, "sambar");
  normalized = normalized.replace(/\b(upmas?)\b/g, "upma");
  normalized = normalized.replace(/\b(pohe?)\b/g, "poha");
  return normalized.replace(/\s+/g, " ").trim();
}

interface KnowledgeFood {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  referenceAmount: number;
  referenceUnit: "g" | "ml";
  unitWeights?: Partial<Record<ServingUnit, number>>;
  defaultUnit?: ServingUnit;
}

// Values are for the stated reference amount. Prepared foods with widely varying
// recipes (such as curries and biryani) intentionally fall through to Gemini.
const KnowledgeBase: Record<string, KnowledgeFood> = {
  roti: { calories: 120, protein: 4, fat: 3, carbs: 20, fiber: 3, referenceAmount: 40, referenceUnit: "g", unitWeights: { piece: 40 }, defaultUnit: "piece" },
  rice: { calories: 130, protein: 3, fat: 0.5, carbs: 28, fiber: 0.4, referenceAmount: 100, referenceUnit: "g", unitWeights: { cup: 158, bowl: 200 } },
  dal: { calories: 75, protein: 4, fat: 2, carbs: 10, fiber: 4, referenceAmount: 100, referenceUnit: "g", unitWeights: { cup: 200, bowl: 200 } },
  paneer: { calories: 265, protein: 18, fat: 20, carbs: 3, fiber: 0, referenceAmount: 100, referenceUnit: "g" },
  milk: { calories: 60, protein: 3.2, fat: 3, carbs: 5, fiber: 0, referenceAmount: 100, referenceUnit: "ml", unitWeights: { cup: 240 } },
  curd: { calories: 60, protein: 3.5, fat: 3.3, carbs: 4.7, fiber: 0, referenceAmount: 100, referenceUnit: "g", unitWeights: { cup: 245, bowl: 200 } },
  egg: { calories: 70, protein: 6, fat: 5, carbs: 0.5, fiber: 0, referenceAmount: 50, referenceUnit: "g", unitWeights: { piece: 50 }, defaultUnit: "piece" },
  "chicken breast": { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, referenceAmount: 100, referenceUnit: "g" },
  apple: { calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 182 }, defaultUnit: "piece" },
  banana: { calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6, referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 118 }, defaultUnit: "piece" },
  poha: { calories: 180, protein: 4, fat: 5, carbs: 30, fiber: 2, referenceAmount: 150, referenceUnit: "g", unitWeights: { bowl: 150 } },
  idli: { calories: 40, protein: 1.5, fat: 0.2, carbs: 8, fiber: 1, referenceAmount: 40, referenceUnit: "g", unitWeights: { piece: 40 }, defaultUnit: "piece" },
  "plain dosa": { calories: 130, protein: 3, fat: 4, carbs: 20, fiber: 2, referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 100 }, defaultUnit: "piece" },
  sambar: { calories: 75, protein: 3, fat: 2.5, carbs: 10, fiber: 1.5, referenceAmount: 100, referenceUnit: "g", unitWeights: { cup: 240, bowl: 200 } },
  upma: { calories: 200, protein: 5, fat: 7, carbs: 28, fiber: 2, referenceAmount: 150, referenceUnit: "g", unitWeights: { bowl: 150 } },
  oats: { calories: 389, protein: 16.9, fat: 6.9, carbs: 66, fiber: 10.6, referenceAmount: 100, referenceUnit: "g" },
  rajma: { calories: 127, protein: 9, fat: 0.5, carbs: 22, fiber: 6, referenceAmount: 100, referenceUnit: "g", unitWeights: { cup: 177, bowl: 200 } },
  chole: { calories: 164, protein: 8.9, fat: 2.6, carbs: 27.4, fiber: 7.6, referenceAmount: 100, referenceUnit: "g", unitWeights: { cup: 164, bowl: 200 } },
  "soya chunks": { calories: 345, protein: 52, fat: 0.5, carbs: 33, fiber: 13, referenceAmount: 100, referenceUnit: "g" },
  sprouts: { calories: 30, protein: 3.8, fat: 0.2, carbs: 6, fiber: 1.8, referenceAmount: 100, referenceUnit: "g", unitWeights: { cup: 100, bowl: 150 } },
  bread: { calories: 75, protein: 2.5, fat: 1, carbs: 14, fiber: 1, referenceAmount: 30, referenceUnit: "g", unitWeights: { piece: 30, slice: 30 }, defaultUnit: "slice" },
  almond: { calories: 579, protein: 21, fat: 50, carbs: 22, fiber: 12.5, referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 1.2 }, defaultUnit: "piece" },
  "whey protein": { calories: 120, protein: 25, fat: 1, carbs: 3, fiber: 0, referenceAmount: 30, referenceUnit: "g", unitWeights: { scoop: 30 } },
};

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : String(Math.round(amount * 100) / 100);
}

function calculateMultiplier(food: KnowledgeFood, quantity: number, unit: QuantityUnit | undefined, quantityProvided: boolean): number | null {
  if (!quantityProvided) {
    if (!food.defaultUnit || !food.unitWeights?.[food.defaultUnit]) return null;
    return food.unitWeights[food.defaultUnit] / food.referenceAmount;
  }
  if (unit === "g" || unit === "ml") return unit === food.referenceUnit ? quantity / food.referenceAmount : null;
  const servingUnit = unit ?? "piece";
  const unitWeight = food.unitWeights?.[servingUnit];
  return unitWeight ? (quantity * unitWeight) / food.referenceAmount : null;
}

class KnowledgeBaseParser implements MealParser {
  async parse(context: ParseContext): Promise<MealResult | null> {
    const parts = context.normalizedText.split(/\s+and\s+/).filter(Boolean);
    if (!parts.length) return null;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalFiber = 0;
    const foodsDetected: string[] = [];

    for (const part of parts) {
      const match = part.match(/^(?:(\d+(?:\.\d+)?)\s*(g|ml|bowl|cup|piece|slice|scoop)?\s*(?:of\s+)?)?(.+)$/);
      if (!match) return null;
      const quantityProvided = Boolean(match[1]);
      const quantity = quantityProvided ? Number.parseFloat(match[1]) : 1;
      const unit = match[2] as QuantityUnit | undefined;
      const foodName = match[3].trim();
      const food = KnowledgeBase[foodName];
      if (!food || !Number.isFinite(quantity) || quantity <= 0) return null;
      const multiplier = calculateMultiplier(food, quantity, unit, quantityProvided);
      if (!multiplier || multiplier > 50) return null;

      totalCalories += food.calories * multiplier;
      totalProtein += food.protein * multiplier;
      totalFat += food.fat * multiplier;
      totalCarbs += food.carbs * multiplier;
      totalFiber += food.fiber * multiplier;
      const detectedUnit = unit ?? food.defaultUnit ?? "serving";
      foodsDetected.push(`${formatAmount(quantityProvided ? quantity : 1)} ${detectedUnit} ${foodName}`);
    }

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
      confidence: 99,
      foods_detected: foodsDetected,
      coaching_tip: "Great, simple and tracked accurately!",
    };
  }
}

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildGeminiPrompt(context: ParseContext): string {
  return `You are a precise nutrition expert for Indian and international foods. Analyze this meal: "${context.originalText}". Meal type: ${context.mealType}. The user has ${context.remainingCalories ?? "unknown"} kcal remaining today and needs ${context.remainingProtein ?? "unknown"}g more protein. User's goal: ${context.userGoal}.
Instructions:
1. Identify each food item and its exact quantity from the text. Never default to 100g unless grams were stated.
2. Scale nutrition strictly by the stated quantity. Return evaluated numbers, never mathematical expressions.
3. Use standard serving conversions only when the food and serving are clear. For ambiguous dishes, make a conservative estimate and lower confidence.
4. Confidence: 95-100 for named items with quantities, 80-94 for named items without quantities, and 60-79 for ambiguous descriptions.
5. Write one concise, personalized coaching tip based on the user's remaining targets and goal.
Return JSON only with this exact shape:
{
  "calories": number,
  "protein": number,
  "fat": number,
  "carbs": number,
  "fiber": number,
  "confidence": number,
  "foods_detected": string[],
  "coaching_tip": string
}`;
}

class GeminiParser implements MealParser {
  async parse(context: ParseContext): Promise<MealResult> {
    const apiKey = context.geminiApiKey;
    if (!apiKey) {
      console.error(JSON.stringify({ level: "error", stage: "Gemini", event: "missing_secret", request_id: context.requestId }));
      throw new MealAiError("missing_secret", 503);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildGeminiPrompt(context) }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json", maxOutputTokens: 1024 },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      console.error(JSON.stringify({ level: "error", stage: "Gemini", event: isTimeout ? "timeout" : "request_failed", request_id: context.requestId, latency_ms: Date.now() - startedAt }));
      throw new MealAiError(isTimeout ? "timeout" : "provider_error", isTimeout ? 504 : 502);
    } finally {
      clearTimeout(timeoutId);
    }

    console.log(JSON.stringify({ level: "info", stage: "Gemini", event: "response_received", request_id: context.requestId, status: response.status, latency_ms: Date.now() - startedAt }));
    if (!response.ok) {
      console.error(JSON.stringify({ level: "error", stage: "Gemini", event: "http_error", request_id: context.requestId, status: response.status }));
      throw new MealAiError("provider_error", 502);
    }

    let responseBody: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    try {
      responseBody = await response.json();
    } catch {
      console.error(JSON.stringify({ level: "error", stage: "Gemini", event: "invalid_json", request_id: context.requestId }));
      throw new MealAiError("invalid_response", 502);
    }
    const content = responseBody.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!content) {
      console.error(JSON.stringify({ level: "error", stage: "Gemini", event: "empty_response", request_id: context.requestId }));
      throw new MealAiError("invalid_response", 502);
    }
    try {
      return MealSchema.parse(JSON.parse(content));
    } catch {
      console.error(JSON.stringify({ level: "error", stage: "Gemini", event: "schema_rejected", request_id: context.requestId }));
      throw new MealAiError("invalid_response", 502);
    }
  }
}

class NutritionValidator {
  validate(data: MealResult): MealResult {
    if (data.protein < 0) data.protein = 0;
    if (data.fat < 0) data.fat = 0;
    if (data.carbs < 0) data.carbs = 0;
    const macroCalories = (data.protein * 4) + (data.carbs * 4) + (data.fat * 9);
    if (macroCalories > data.calories * 1.5 || macroCalories < data.calories * 0.5) data.calories = Math.round(macroCalories);
    if (data.calories > 10_000 || data.protein > 500 || data.fat > 500 || data.carbs > 1_000) throw new Error("Parsed nutrition values exceed reasonable limits");
    return data;
  }
}

type CacheEntry = {
  normalizedText: string;
  result: MealResult;
  quantities: Array<{ foodName: string; effectiveAmount: number }>;
};

const memoryCache = new Map<string, CacheEntry[]>();

function parseMealQuantities(normalizedText: string): Array<{ foodName: string; effectiveAmount: number }> | null {
  const parts = normalizedText.split(/\s+and\s+/).filter(Boolean);
  if (!parts.length) return null;

  const entries: Array<{ foodName: string; effectiveAmount: number }> = [];
  for (const part of parts) {
    const match = part.match(/^(?:(\d+(?:\.\d+)?)\s*(g|ml|bowl|cup|piece|slice|scoop)?\s*(?:of\s+)?)?(.+)$/);
    if (!match) return null;
    const quantityProvided = Boolean(match[1]);
    const quantity = quantityProvided ? Number.parseFloat(match[1]) : 1;
    const unit = match[2] as QuantityUnit | undefined;
    const foodName = match[3].trim();
    const food = KnowledgeBase[foodName];
    if (!food || !Number.isFinite(quantity) || quantity <= 0) return null;
    const multiplier = calculateMultiplier(food, quantity, unit, quantityProvided);
    if (!multiplier || multiplier > 50) return null;
    entries.push({ foodName, effectiveAmount: multiplier * food.referenceAmount });
  }

  return entries;
}

function mealIdentityFor(normalizedText: string): string | null {
  const quantities = parseMealQuantities(normalizedText);
  if (!quantities) return null;
  return `${quantities.map((entry) => entry.foodName).join("|")}`;
}

function safeScalingRatio(candidate: Array<{ foodName: string; effectiveAmount: number }>, query: Array<{ foodName: string; effectiveAmount: number }>): number | null {
  if (candidate.length !== query.length) return null;

  const ratios: number[] = [];
  for (let index = 0; index < candidate.length; index += 1) {
    const candidateEntry = candidate[index];
    const queryEntry = query[index];
    if (!candidateEntry || !queryEntry) return null;
    if (candidateEntry.foodName !== queryEntry.foodName) return null;
    if (candidateEntry.effectiveAmount <= 0 || queryEntry.effectiveAmount <= 0) return null;
    ratios.push(queryEntry.effectiveAmount / candidateEntry.effectiveAmount);
  }

  if (!ratios.length) return null;
  const ratio = ratios[0];
  if (!ratios.every((value) => Math.abs(value - ratio) < 1e-6)) return null;
  return ratio;
}

function scaleMealResult(data: MealResult, ratio: number): MealResult {
  return {
    ...data,
    calories: Math.round(data.calories * ratio),
    protein: Math.round(data.protein * ratio * 10) / 10,
    fat: Math.round(data.fat * ratio * 10) / 10,
    carbs: Math.round(data.carbs * ratio * 10) / 10,
    fiber: Math.round(data.fiber * ratio * 10) / 10,
  };
}

function cacheKeyFor(context: ParseContext): string {
  const identity = mealIdentityFor(context.normalizedText);
  return `${context.mealType}:${identity ?? context.normalizedText}`;
}

function responseFor(data: MealResult, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let body: Record<string, unknown>;

  try {
    body = await req.json();
    console.log(JSON.stringify({ level: "debug", stage: "request", event: "body_received", request_id: requestId, body_keys: Object.keys(body) }));
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return new Response(JSON.stringify({ error: "Meal text is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const mealType = typeof body.mealType === "string" && body.mealType.trim() ? body.mealType.trim().toLowerCase() : "unspecified";
  const remainingCalories = typeof body.remainingCalories === "number" || typeof body.remainingCalories === "string" ? body.remainingCalories : "unknown";
  const remainingProtein = typeof body.remainingProtein === "number" || typeof body.remainingProtein === "string" ? body.remainingProtein : "unknown";
  const userGoal = typeof body.userGoal === "string" && body.userGoal.trim() ? body.userGoal : "maintenance";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized: Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized: Invalid token");

    const endpoint = "parse-meal";
    const limit = Number.parseInt(Deno.env.get("DAILY_AI_LIMIT") || "50", 10);
    const istDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const today = istDate.toISOString().split("T")[0];

    const context: ParseContext = {
      originalText: text,
      normalizedText: normalizeInput(text),
      mealType,
      remainingCalories,
      remainingProtein,
      userGoal,
      geminiApiKey: Deno.env.get("GEMINI_API_KEY"),
      requestId,
    };
    const validator = new NutritionValidator();

    // Ordered as knowledge base -> cache -> Gemini, so common foods avoid all external work.
    const knowledgeBaseStartedAt = Date.now();
    const knowledgeBaseResult = await new KnowledgeBaseParser().parse(context);
    if (knowledgeBaseResult) {
      const validated = validator.validate(knowledgeBaseResult);
      console.log(JSON.stringify({ level: "info", stage: "KnowledgeBase", event: "hit", request_id: requestId, latency_ms: Date.now() - knowledgeBaseStartedAt }));
      return responseFor(validated, corsHeaders);
    }
    console.log(JSON.stringify({ level: "info", stage: "KnowledgeBase", event: "miss", request_id: requestId, latency_ms: Date.now() - knowledgeBaseStartedAt }));

    const cacheKey = cacheKeyFor(context);
    const cacheStartedAt = Date.now();
    const queryQuantities = parseMealQuantities(context.normalizedText) ?? [];
    const memoryEntries = memoryCache.get(cacheKey) ?? [];
    const exactMemoryHit = memoryEntries.find((entry) => entry.normalizedText === context.normalizedText);
    if (exactMemoryHit) {
      console.log(JSON.stringify({ level: "info", stage: "MemoryCache", event: "hit", request_id: requestId, latency_ms: Date.now() - cacheStartedAt }));
      return responseFor(exactMemoryHit.result, corsHeaders);
    }

    const scaledMemoryHit = memoryEntries.find((entry) => {
      const ratio = safeScalingRatio(entry.quantities, queryQuantities);
      return ratio && ratio > 0 && ratio < 50;
    });
    if (scaledMemoryHit) {
      const ratio = safeScalingRatio(scaledMemoryHit.quantities, queryQuantities);
      const scaledResult = ratio ? scaleMealResult(scaledMemoryHit.result, ratio) : scaledMemoryHit.result;
      console.log(JSON.stringify({ level: "info", stage: "MemoryCache", event: "scaled_hit", request_id: requestId, latency_ms: Date.now() - cacheStartedAt, ratio }));
      return responseFor(scaledResult, corsHeaders);
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const cacheClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : supabase;
    try {
      const { data: cacheData, error: cacheError } = await cacheClient.from("meal_parse_cache").select("result").eq("normalized_text", context.normalizedText).eq("meal_type", context.mealType).limit(1).maybeSingle();
      if (cacheError) {
        console.error(JSON.stringify({ level: "error", stage: "DBCache", event: "read_error", request_id: requestId }));
      } else if (cacheData?.result) {
        const cached = MealSchema.safeParse(cacheData.result);
        if (cached.success) {
          const validated = validator.validate(cached.data);
          const cachedEntry: CacheEntry = {
            normalizedText: context.normalizedText,
            result: validated,
            quantities: queryQuantities,
          };
          const dbEntries = memoryCache.get(cacheKey) ?? [];
          dbEntries.push(cachedEntry);
          memoryCache.set(cacheKey, dbEntries.slice(-25));
          console.log(JSON.stringify({ level: "info", stage: "DBCache", event: "hit", request_id: requestId, latency_ms: Date.now() - cacheStartedAt }));
          return responseFor(validated, corsHeaders);
        }
      }
    } catch {
      console.error(JSON.stringify({ level: "error", stage: "DBCache", event: "read_exception", request_id: requestId }));
    }
    console.log(JSON.stringify({ level: "info", stage: "DBCache", event: "miss", request_id: requestId, latency_ms: Date.now() - cacheStartedAt }));

    const { data: usageData } = await supabase.from("api_usage").select("usage_count").eq("user_id", user.id).eq("endpoint", endpoint).eq("date", today).maybeSingle();
    const currentUsage = usageData?.usage_count || 0;
    if (currentUsage >= limit) {
      const istTime = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      istTime.setUTCHours(24, 0, 0, 0);
      const resetsAt = new Date(istTime.getTime() - 5.5 * 60 * 60 * 1000);
      return new Response(JSON.stringify({ error: "Daily AI limit reached", limit, used: currentUsage, resets_at: resetsAt.toISOString(), _limitReached: true }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = validator.validate(await new GeminiParser().parse(context));
    const cacheEntry: CacheEntry = {
      normalizedText: context.normalizedText,
      result: data,
      quantities: queryQuantities,
    };
    const existingEntries = memoryCache.get(cacheKey) ?? [];
    existingEntries.push(cacheEntry);
    memoryCache.set(cacheKey, existingEntries.slice(-25));
    try {
      const { error: cacheWriteError } = await cacheClient.from("meal_parse_cache").insert({ normalized_text: context.normalizedText, meal_type: context.mealType, result: data });
      if (cacheWriteError) console.error(JSON.stringify({ level: "error", stage: "DBCache", event: "write_error", request_id: requestId }));
    } catch {
      console.error(JSON.stringify({ level: "error", stage: "DBCache", event: "write_exception", request_id: requestId }));
    }

    const { error: incrementError } = await supabase.rpc("increment_api_usage", { p_user_id: user.id, p_endpoint: endpoint, p_date: today });
    if (incrementError) console.error(JSON.stringify({ level: "error", stage: "UsageTracking", event: "increment_error", request_id: requestId }));
    console.log(JSON.stringify({ level: "info", stage: "Pipeline", event: "success", parser: "Gemini", request_id: requestId, total_latency_ms: Date.now() - startedAt }));
    return responseFor(data, corsHeaders);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (error instanceof MealAiError) {
      console.error(JSON.stringify({ level: "error", stage: "Gemini", event: error.code, request_id: requestId }));
      return new Response(JSON.stringify({ error: "Meal analysis is temporarily unavailable. Please try again." }), { status: error.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.error(JSON.stringify({ level: "error", stage: "Pipeline", event: "failed", request_id: requestId }));
    return new Response(JSON.stringify({ error: "Unable to parse this meal right now. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
