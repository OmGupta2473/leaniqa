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

  // Aliases are single-word spelling/regional variants only.
  // Rule: never substitute a word that is a substring of an existing KB key,
  // because those compounds (aloo gobhi, chicken breast, fish fry, mutton biryani)
  // must match the KB exactly.
  normalized = normalized.replace(/\b(chapatis?|chapathis?|chapattis?|phulkas?|rotis?)\b/g, "roti");
  normalized = normalized.replace(/\b(aloo paranthas?|aloo parathas?|alu parathas?)\b/g, "aloo paratha");
  normalized = normalized.replace(/\b(paranthas?|parathas?|porottas?)\b/g, "paratha");
  normalized = normalized.replace(/\b(poori|puris?)\b/g, "puri");
  normalized = normalized.replace(/\b(naan|naans)\b/g, "naan");
  normalized = normalized.replace(/\b(bhature|bhaturas?|bature)\b/g, "bhatura");
  normalized = normalized.replace(/\b(chawal|bhaat|bhat|rices?)\b/g, "rice");
  normalized = normalized.replace(/\b(cumin rice)\b/g, "jeera rice");
  normalized = normalized.replace(/\b(boiled rice)\b/g, "brown rice");
  normalized = normalized.replace(/\b(mung dal|green gram dal|pesara pappu)\b/g, "moong dal");
  normalized = normalized.replace(/\b(masur dal|red lentil)\b/g, "masoor dal");
  normalized = normalized.replace(/\b(toor dal|arhar dal|toovar dal|dals?)\b/g, "dal");
  normalized = normalized.replace(/\b(daal|dhal)\b/g, "dal");
  normalized = normalized.replace(/\b(rajmah|kidney beans)\b/g, "rajma");
  normalized = normalized.replace(/\b(chana masala|chickpea curry|cholay|chholey)\b/g, "chole");
  normalized = normalized.replace(/\b(spinach paneer)\b/g, "palak paneer");
  normalized = normalized.replace(/\b(matar paneer)\b/g, "mutter paneer");
  normalized = normalized.replace(/\b(okra|lady finger)\b/g, "bhindi");
  normalized = normalized.replace(/\b(brinjal|eggplant|aubergine)\b/g, "baigan bharta");
  normalized = normalized.replace(/\b(baingan)\b/g, "baigan");
  normalized = normalized.replace(/\b(batata)\b/g, "aloo");
  normalized = normalized.replace(/\b(yogurt|yoghurt|thayir|dahi)\b/g, "curd");
  normalized = normalized.replace(/\b(dudh|milks?)\b/g, "milk");
  normalized = normalized.replace(/\b(chaas|mor|majjige)\b/g, "buttermilk");
  normalized = normalized.replace(/\b(anda|ande|boiled egg|boiled eggs|eggs?)\b/g, "egg");
  normalized = normalized.replace(/\b(murgh)\b/g, "chicken");
  normalized = normalized.replace(/\b(chicken breasts?)\b/g, "chicken breast");
  normalized = normalized.replace(/\b(goat meat|lamb)\b/g, "mutton");
  normalized = normalized.replace(/\b(dhokla|dhoklas?|khaman)\b/g, "dhokla");
  normalized = normalized.replace(/\b(golgappa|gol gappa|puchka)\b/g, "pani puri");
  normalized = normalized.replace(/\b(vadapav|vada pao)\b/g, "vada pav");
  normalized = normalized.replace(/\b(alu tikki)\b/g, "aloo tikki");
  normalized = normalized.replace(/\b(momo|momos|dumpling)\b/g, "momos");
  normalized = normalized.replace(/\b(biscuits?|cookies?|biskut)\b/g, "biscuit");
  normalized = normalized.replace(/\b(samosas?|singara)\b/g, "samosa");
  normalized = normalized.replace(/\b(bread pakoda|bread pakodas?)\b/g, "bread pakora");
  normalized = normalized.replace(/\b(pakoras?|pakoda|bhajiya|bhaji)\b/g, "pakora");
  normalized = normalized.replace(/\b(khichuri|khichri)\b/g, "khichdi");
  normalized = normalized.replace(/\b(ven pongal)\b/g, "pongal");
  normalized = normalized.replace(/\b(sambhar|sambhars?|kuzhambu)\b/g, "sambar");
  normalized = normalized.replace(/\b(uthappam|ootapam)\b/g, "uttapam");
  normalized = normalized.replace(/\b(idly|iddli|idlis?)\b/g, "idli");
  normalized = normalized.replace(/\b(cheela|besan chilla)\b/g, "chilla");
  normalized = normalized.replace(/\b(theplas?)\b/g, "thepla");
  normalized = normalized.replace(/\b(payasam|payesh|kheera)\b/g, "kheer");
  normalized = normalized.replace(/\b(rosogolla)\b/g, "rasgulla");
  normalized = normalized.replace(/\b(gulabjamun)\b/g, "gulab jamun");
  normalized = normalized.replace(/\b(srikhand)\b/g, "shrikhand");
  normalized = normalized.replace(/\b(rabadi)\b/g, "rabri");
  normalized = normalized.replace(/\b(uppma|uppitu|upmas?)\b/g, "upma");
  normalized = normalized.replace(/\b(pohe?)\b/g, "poha");
  normalized = normalized.replace(/\b(semiya|seviyan|sevai)\b/g, "vermicelli");
  normalized = normalized.replace(/\b(ankurit|sprouted)\b/g, "sprouts");
  normalized = normalized.replace(/\b(meal maker|nutrela)\b/g, "soya chunks");
  normalized = normalized.replace(/\b(patta gobhi|bandh gobi)\b/g, "cabbage sabzi");
  normalized = normalized.replace(/\b(bell pepper)\b/g, "shimla mirch aloo");
  normalized = normalized.replace(/\b(dudhi|bottle gourd|opu)\b/g, "lauki sabzi");
  normalized = normalized.replace(/\b(kashi halwa)\b/g, "kaddu sabzi");
  normalized = normalized.replace(/\b(methi alu)\b/g, "methi aloo");
  normalized = normalized.replace(/\b(mixed veg|veg curry)\b/g, "mixed vegetable");
  normalized = normalized.replace(/\b(apples?|seb)\b/g, "apple");
  normalized = normalized.replace(/\b(bananas?|kelas?|kela)\b/g, "banana");
  normalized = normalized.replace(/\b(mangoes?|mangos?|aam)\b/g, "mango");
  normalized = normalized.replace(/\b(papayas?)\b/g, "papaya");
  normalized = normalized.replace(/\b(oranges?)\b/g, "orange");
  normalized = normalized.replace(/\b(guavas?|amrood)\b/g, "guava");
  normalized = normalized.replace(/\b(grapes?|angoor)\b/g, "grapes");
  normalized = normalized.replace(/\b(watermelons?|tarbuj)\b/g, "watermelon");
  normalized = normalized.replace(/\b(pomegranates?|anar)\b/g, "pomegranate");
  normalized = normalized.replace(/\b(almonds?|badam)\b/g, "almond");
  normalized = normalized.replace(/\b(cashews?|kaju)\b/g, "cashew");
  normalized = normalized.replace(/\b(peanuts?|moongfali|groundnut)\b/g, "peanut");
  normalized = normalized.replace(/\b(walnuts?|akhrot)\b/g, "walnut");
  normalized = normalized.replace(/\b(kaapi)\b/g, "coffee");
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

// Values are for the stated reference amount. Prepared dishes use the IFCT 2017 /
// INDB standard recipe. Branded or novel restaurant dishes still fall through to Gemini.
const KnowledgeBase: Record<string, KnowledgeFood> = {
  // ============================================================
  // CEREALS & GRAINS — cooked, per 100g
  // ============================================================
  "rice":               { calories: 130, protein: 2.7,  fat: 0.3,  carbs: 28.0, fiber: 0.4,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150, cup: 158 }, defaultUnit: "bowl" },
  "brown rice":         { calories: 123, protein: 2.7,  fat: 1.0,  carbs: 25.6, fiber: 1.6,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150, cup: 158 }, defaultUnit: "bowl" },
  "jeera rice":         { calories: 165, protein: 3.0,  fat: 4.5,  carbs: 28.0, fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "roti":               { calories: 265, protein: 8.5,  fat: 3.5,  carbs: 50.0, fiber: 4.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 35 }, defaultUnit: "piece" },
  "chapati":            { calories: 265, protein: 8.5,  fat: 3.5,  carbs: 50.0, fiber: 4.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 35 }, defaultUnit: "piece" },
  "phulka":             { calories: 220, protein: 7.5,  fat: 1.0,  carbs: 47.0, fiber: 3.8,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 30 }, defaultUnit: "piece" },
  "paratha":            { calories: 330, protein: 6.4,  fat: 13.0, carbs: 45.4, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 60 }, defaultUnit: "piece" },
  "aloo paratha":       { calories: 270, protein: 5.5,  fat: 10.5, carbs: 37.0, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 120 }, defaultUnit: "piece" },
  "puri":               { calories: 460, protein: 6.0,  fat: 20.0, carbs: 60.0, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 30 }, defaultUnit: "piece" },
  "naan":               { calories: 310, protein: 10.2, fat: 5.7,  carbs: 55.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 90 }, defaultUnit: "piece" },
  "bhatura":            { calories: 380, protein: 7.0,  fat: 15.0, carbs: 52.0, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 80 }, defaultUnit: "piece" },
  "poha":               { calories: 120, protein: 2.7,  fat: 3.3,  carbs: 20.0, fiber: 1.3,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "upma":               { calories: 130, protein: 3.3,  fat: 4.7,  carbs: 18.7, fiber: 1.3,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "idli":               { calories: 130, protein: 3.8,  fat: 0.8,  carbs: 24.0, fiber: 1.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 40 }, defaultUnit: "piece" },
  "plain dosa":         { calories: 130, protein: 3.0,  fat: 4.0,  carbs: 20.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 100 }, defaultUnit: "piece" },
  "masala dosa":        { calories: 190, protein: 3.5,  fat: 8.0,  carbs: 25.0, fiber: 2.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 150 }, defaultUnit: "piece" },
  "rava dosa":          { calories: 160, protein: 3.5,  fat: 6.0,  carbs: 22.0, fiber: 1.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 90 }, defaultUnit: "piece" },
  "khichdi":            { calories: 115, protein: 5.5,  fat: 2.5,  carbs: 20.5, fiber: 2.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 200 }, defaultUnit: "bowl" },
  "pongal":             { calories: 150, protein: 4.5,  fat: 5.0,  carbs: 22.0, fiber: 1.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 180 }, defaultUnit: "bowl" },
  "thepla":             { calories: 300, protein: 8.0,  fat: 12.0, carbs: 40.0, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 40 }, defaultUnit: "piece" },
  "chilla":             { calories: 200, protein: 10.0, fat: 7.0,  carbs: 25.0, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 60 }, defaultUnit: "piece" },
  "uttapam":            { calories: 140, protein: 3.5,  fat: 4.5,  carbs: 21.0, fiber: 1.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 120 }, defaultUnit: "piece" },
  "vermicelli":         { calories: 140, protein: 4.0,  fat: 4.0,  carbs: 22.0, fiber: 1.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "oats":  { calories: 389, protein: 16.9, fat: 6.9,  carbs: 66.3, fiber: 10.6, referenceAmount: 100, referenceUnit: "g" },
  "bread": { calories: 265, protein: 8.5,  fat: 3.2,  carbs: 49.0, fiber: 2.7,  referenceAmount: 100, referenceUnit: "g", unitWeights: { slice: 30, piece: 30 }, defaultUnit: "slice" },

  // ============================================================
  // DALS & LEGUMES — cooked, per 100g
  // ============================================================
  "dal":                { calories: 114, protein: 7.2,  fat: 0.5,  carbs: 20.9, fiber: 5.1,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150, cup: 200 }, defaultUnit: "bowl" },
  "dal tadka":          { calories: 131, protein: 6.5,  fat: 5.0,  carbs: 16.0, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "dal makhani":        { calories: 140, protein: 6.0,  fat: 7.0,  carbs: 15.0, fiber: 4.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "dal fry":            { calories: 120, protein: 5.5,  fat: 4.5,  carbs: 15.0, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "moong dal":          { calories: 105, protein: 7.6,  fat: 0.7,  carbs: 19.0, fiber: 4.1,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "masoor dal":         { calories: 116, protein: 9.0,  fat: 0.4,  carbs: 20.1, fiber: 4.9,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "rajma":              { calories: 127, protein: 8.7,  fat: 0.5,  carbs: 22.8, fiber: 6.4,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150, cup: 177 }, defaultUnit: "bowl" },
  "chole":              { calories: 164, protein: 8.9,  fat: 2.6,  carbs: 27.4, fiber: 7.6,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150, cup: 164 }, defaultUnit: "bowl" },
  "kadhi":              { calories: 90,  protein: 3.5,  fat: 4.5,  carbs: 9.0,  fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 200 }, defaultUnit: "bowl" },
  "sambar":             { calories: 81,  protein: 4.0,  fat: 2.1,  carbs: 12.0, fiber: 2.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 160, cup: 240 }, defaultUnit: "bowl" },
  "rasam":              { calories: 40,  protein: 2.0,  fat: 1.0,  carbs: 6.0,  fiber: 1.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150, cup: 240 }, defaultUnit: "bowl" },
  "soya chunks":        { calories: 345, protein: 52.0, fat: 0.5,  carbs: 33.0, fiber: 13.0, referenceAmount: 100, referenceUnit: "g" },
  "sprouts":            { calories: 30,  protein: 3.8,  fat: 0.2,  carbs: 6.0,  fiber: 1.8,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150, cup: 100 }, defaultUnit: "bowl" },

  // ============================================================
  // VEGETABLES & SABZI — cooked, per 100g
  // ============================================================
  "aloo curry":         { calories: 105, protein: 1.2,  fat: 5.0,  carbs: 14.4, fiber: 1.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "aloo gobhi":         { calories: 121, protein: 2.2,  fat: 5.4,  carbs: 16.0, fiber: 2.2,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "aloo matar":         { calories: 120, protein: 3.0,  fat: 5.0,  carbs: 17.0, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "dum aloo":           { calories: 150, protein: 2.0,  fat: 7.0,  carbs: 20.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "bhindi":             { calories: 161, protein: 3.9,  fat: 10.7, carbs: 12.1, fiber: 2.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 130 }, defaultUnit: "bowl" },
  "baigan bharta":      { calories: 70,  protein: 1.2,  fat: 4.7,  carbs: 5.7,  fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "mutter paneer":      { calories: 147, protein: 8.5,  fat: 8.1,  carbs: 10.7, fiber: 2.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "palak paneer":       { calories: 180, protein: 9.0,  fat: 12.0, carbs: 8.0,  fiber: 2.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "cabbage sabzi":      { calories: 131, protein: 2.3,  fat: 5.0,  carbs: 7.0,  fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 130 }, defaultUnit: "bowl" },
  "shimla mirch aloo":  { calories: 93,  protein: 1.5,  fat: 3.4,  carbs: 12.8, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 130 }, defaultUnit: "bowl" },
  "kaddu sabzi":        { calories: 67,  protein: 1.6,  fat: 3.8,  carbs: 6.7,  fiber: 1.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 130 }, defaultUnit: "bowl" },
  "lauki sabzi":        { calories: 45,  protein: 1.0,  fat: 2.0,  carbs: 6.0,  fiber: 1.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 130 }, defaultUnit: "bowl" },
  "methi aloo":         { calories: 121, protein: 2.2,  fat: 5.4,  carbs: 16.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 130 }, defaultUnit: "bowl" },
  "mixed vegetable":    { calories: 103, protein: 1.3,  fat: 4.7,  carbs: 12.3, fiber: 3.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "salad":              { calories: 50,  protein: 2.0,  fat: 0.0,  carbs: 10.0, fiber: 2.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },

  // ============================================================
  // DAIRY — per 100g / 100ml
  // ============================================================
  "paneer":             { calories: 265, protein: 18.3, fat: 20.8, carbs: 1.2,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 30, bowl: 150 }, defaultUnit: "piece" },
  "curd":               { calories: 60,  protein: 3.5,  fat: 3.3,  carbs: 4.7,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 200, cup: 245 }, defaultUnit: "bowl" },
  "milk":               { calories: 65,  protein: 3.2,  fat: 3.7,  carbs: 4.7,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "ml", unitWeights: { cup: 240 }, defaultUnit: "cup" },
  "ghee":               { calories: 900, protein: 0.3,  fat: 99.5, carbs: 0.0,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g" },
  "butter":             { calories: 720, protein: 0.5,  fat: 80.0, carbs: 0.5,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g" },
  "lassi":              { calories: 70,  protein: 2.5,  fat: 2.0,  carbs: 10.0, fiber: 0.0,  referenceAmount: 100, referenceUnit: "ml", unitWeights: { cup: 240 }, defaultUnit: "cup" },
  "buttermilk":         { calories: 22,  protein: 1.5,  fat: 0.8,  carbs: 2.5,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "ml", unitWeights: { cup: 240 }, defaultUnit: "cup" },
  "cream":              { calories: 340, protein: 2.0,  fat: 36.0, carbs: 3.0,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g" },

  // ============================================================
  // NON-VEGETARIAN — cooked, per 100g
  // ============================================================
  "egg":                { calories: 155, protein: 13.0, fat: 11.0, carbs: 1.1,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 50 }, defaultUnit: "piece" },
  "chicken curry":      { calories: 140, protein: 14.0, fat: 8.0,  carbs: 3.0,  fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "chicken breast":     { calories: 165, protein: 31.0, fat: 3.6,  carbs: 0.0,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g" },
  "chicken tikka":      { calories: 165, protein: 25.0, fat: 7.0,  carbs: 1.0,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g" },
  "mutton curry":       { calories: 200, protein: 15.0, fat: 14.0, carbs: 4.0,  fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "fish curry":         { calories: 100, protein: 12.0, fat: 4.0,  carbs: 3.0,  fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "fish fry":           { calories: 200, protein: 20.0, fat: 12.0, carbs: 2.0,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 80 }, defaultUnit: "piece" },
  "prawn curry":        { calories: 120, protein: 15.0, fat: 5.0,  carbs: 3.0,  fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "chicken biryani":    { calories: 163, protein: 9.2,  fat: 5.1,  carbs: 20.1, fiber: 1.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 200 }, defaultUnit: "bowl" },
  "mutton biryani":     { calories: 175, protein: 9.5,  fat: 7.0,  carbs: 20.0, fiber: 0.8,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 200 }, defaultUnit: "bowl" },
  "egg curry":          { calories: 120, protein: 8.0,  fat: 8.0,  carbs: 4.0,  fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "whey protein": { calories: 400, protein: 80.0, fat: 3.3, carbs: 10.0, fiber: 0.0, referenceAmount: 100, referenceUnit: "g", unitWeights: { scoop: 30 }, defaultUnit: "scoop" },

  // ============================================================
  // SNACKS & STREET FOOD — per 100g
  // ============================================================
  "samosa":             { calories: 308, protein: 4.5,  fat: 17.0, carbs: 32.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 60 }, defaultUnit: "piece" },
  "pakora":             { calories: 234, protein: 6.7,  fat: 10.3, carbs: 26.8, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 20 }, defaultUnit: "piece" },
  "vada pav":           { calories: 290, protein: 6.0,  fat: 12.0, carbs: 38.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 120 }, defaultUnit: "piece" },
  "dhokla":             { calories: 160, protein: 5.0,  fat: 3.0,  carbs: 28.0, fiber: 1.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 30 }, defaultUnit: "piece" },
  "bhel puri":          { calories: 150, protein: 3.0,  fat: 5.0,  carbs: 23.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 100 }, defaultUnit: "bowl" },
  "pani puri":          { calories: 180, protein: 3.0,  fat: 8.0,  carbs: 24.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 15 }, defaultUnit: "piece" },
  "aloo tikki":         { calories: 180, protein: 3.0,  fat: 8.0,  carbs: 24.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 60 }, defaultUnit: "piece" },
  "bread pakora":       { calories: 250, protein: 6.0,  fat: 12.0, carbs: 30.0, fiber: 2.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 80 }, defaultUnit: "piece" },
  "khandvi":            { calories: 150, protein: 5.0,  fat: 6.0,  carbs: 18.0, fiber: 1.0,  referenceAmount: 100, referenceUnit: "g" },
  "momos":              { calories: 180, protein: 7.0,  fat: 5.0,  carbs: 26.0, fiber: 1.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 25 }, defaultUnit: "piece" },
  "biscuit":            { calories: 450, protein: 7.0,  fat: 15.0, carbs: 72.0, fiber: 2.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 10 }, defaultUnit: "piece" },

  // ============================================================
  // FRUITS — raw, per 100g
  // ============================================================
  "apple":              { calories: 52,  protein: 0.3,  fat: 0.2,  carbs: 14.0, fiber: 2.4,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 180 }, defaultUnit: "piece" },
  "banana":             { calories: 89,  protein: 1.1,  fat: 0.3,  carbs: 23.0, fiber: 2.6,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 120 }, defaultUnit: "piece" },
  "mango":              { calories: 60,  protein: 0.8,  fat: 0.4,  carbs: 15.0, fiber: 1.6,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 200 }, defaultUnit: "piece" },
  "papaya":             { calories: 43,  protein: 0.5,  fat: 0.3,  carbs: 11.0, fiber: 1.7,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "orange":             { calories: 47,  protein: 0.9,  fat: 0.1,  carbs: 12.0, fiber: 2.4,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 140 }, defaultUnit: "piece" },
  "guava":              { calories: 68,  protein: 2.6,  fat: 1.0,  carbs: 14.0, fiber: 5.4,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 150 }, defaultUnit: "piece" },
  "grapes":             { calories: 69,  protein: 0.7,  fat: 0.2,  carbs: 18.0, fiber: 0.9,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "watermelon":         { calories: 30,  protein: 0.6,  fat: 0.2,  carbs: 7.6,  fiber: 0.4,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 200 }, defaultUnit: "bowl" },
  "pomegranate":        { calories: 83,  protein: 1.7,  fat: 1.2,  carbs: 19.0, fiber: 4.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },

  // ============================================================
  // NUTS & SEEDS — per 100g
  // ============================================================
  "almond":             { calories: 579, protein: 21.0, fat: 50.0, carbs: 22.0, fiber: 12.5, referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 1.2 }, defaultUnit: "piece" },
  "cashew":             { calories: 553, protein: 18.0, fat: 44.0, carbs: 30.0, fiber: 3.3,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 1.6 }, defaultUnit: "piece" },
  "peanut":             { calories: 567, protein: 26.0, fat: 49.0, carbs: 16.0, fiber: 8.5,  referenceAmount: 100, referenceUnit: "g" },
  "walnut":             { calories: 654, protein: 15.0, fat: 65.0, carbs: 14.0, fiber: 6.7,  referenceAmount: 100, referenceUnit: "g" },

  // ============================================================
  // BEVERAGES — per 100ml
  // ============================================================
  "chai":               { calories: 100, protein: 2.0,  fat: 3.0,  carbs: 15.0, fiber: 0.0,  referenceAmount: 100, referenceUnit: "ml", unitWeights: { cup: 150 }, defaultUnit: "cup" },
  "coffee":             { calories: 60,  protein: 2.0,  fat: 2.0,  carbs: 8.0,  fiber: 0.0,  referenceAmount: 100, referenceUnit: "ml", unitWeights: { cup: 150 }, defaultUnit: "cup" },

  // ============================================================
  // SWEETS & DESSERTS — per 100g
  // ============================================================
  "kheer":              { calories: 150, protein: 3.5,  fat: 5.0,  carbs: 23.0, fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "rasgulla":           { calories: 180, protein: 3.0,  fat: 5.0,  carbs: 32.0, fiber: 0.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 30 }, defaultUnit: "piece" },
  "gulab jamun":        { calories: 300, protein: 4.0,  fat: 12.0, carbs: 45.0, fiber: 0.5,  referenceAmount: 100, referenceUnit: "g", unitWeights: { piece: 40 }, defaultUnit: "piece" },
  "shrikhand":          { calories: 250, protein: 5.0,  fat: 10.0, carbs: 35.0, fiber: 0.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 150 }, defaultUnit: "bowl" },
  "rabri":              { calories: 280, protein: 7.0,  fat: 15.0, carbs: 30.0, fiber: 0.0,  referenceAmount: 100, referenceUnit: "g", unitWeights: { bowl: 100 }, defaultUnit: "bowl" },
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
      const match = part.match(/^(?:(\d+(?:\.\d+)?)\s*(g|ml|bowl|cup|piece|slice|scoop)?(?=\s|$)\s*(?:of\s+)?)?(.+)$/);
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
    const match = part.match(/^(?:(\d+(?:\.\d+)?)\s*(g|ml|bowl|cup|piece|slice|scoop)?(?=\s|$)\s*(?:of\s+)?)?(.+)$/);
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
    const limit = Number.parseInt(Deno.env.get("DAILY_AI_LIMIT") || "15", 10);
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
    const cacheClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;
    if (cacheClient) {
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
    } else {
      console.log(JSON.stringify({ level: "info", stage: "DBCache", event: "cache_disabled_no_service_role", request_id: requestId }));
    }

    let quotaResult: { usage_count?: number; limit_value?: number } | undefined;
    try {
      const { data, error: quotaError } = await supabase.rpc("reserve_api_usage", {
        p_user_id: user.id,
        p_endpoint: endpoint,
        p_date: today,
        p_limit: limit,
      });
      if (quotaError) {
        throw quotaError;
      }
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      quotaResult = rows[0] as { usage_count?: number; limit_value?: number } | undefined;
    } catch (error) {
      console.error(JSON.stringify({ level: "error", stage: "UsageTracking", event: "reserve_failed", request_id: requestId, error: error instanceof Error ? error.message : String(error) }));
      return new Response(JSON.stringify({ error: "Unable to reserve Gemini quota right now. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!quotaResult) {
      const { data: usageData, error: usageError } = await supabase.from("api_usage").select("usage_count").eq("user_id", user.id).eq("endpoint", endpoint).eq("date", today).maybeSingle();
      if (usageError) {
        console.error(JSON.stringify({ level: "error", stage: "UsageTracking", event: "quota_status_lookup_failed", request_id: requestId, error: usageError.message }));
        return new Response(JSON.stringify({ error: "Unable to reserve Gemini quota right now. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const used = usageData?.usage_count ?? 0;
      const istTime = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      istTime.setUTCHours(24, 0, 0, 0);
      const resetsAt = new Date(istTime.getTime() - 5.5 * 60 * 60 * 1000);
      return new Response(JSON.stringify({ error: "Daily AI limit reached", limit, used, resets_at: resetsAt.toISOString(), _limitReached: true }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    if (cacheClient) {
      try {
        const { error: cacheWriteError } = await cacheClient.from("meal_parse_cache").insert({ normalized_text: context.normalizedText, meal_type: context.mealType, result: data });
        if (cacheWriteError) console.error(JSON.stringify({ level: "error", stage: "DBCache", event: "write_error", request_id: requestId }));
      } catch {
        console.error(JSON.stringify({ level: "error", stage: "DBCache", event: "write_exception", request_id: requestId }));
      }
    } else {
      console.error(JSON.stringify({ level: "error", stage: "DBCache", event: "cache_write_skipped", request_id: requestId }));
    }

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
