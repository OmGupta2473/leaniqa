import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OFO_BASE = "https://world.openfoodfacts.org/api/v2/product";
const VALID_BARCODE = /^\d{8,14}$/;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

type DetectedUnit =
  | "g" | "ml" | "piece" | "scoop" | "tbsp" | "tsp" | "bowl" | "cup" | "serving";

function detectDefaultUnit(product: Record<string, unknown>, servingUnit: string | null): DetectedUnit {
  const name = String(product.product_name ?? product.product_name_en ?? "").toLowerCase();
  const category = String(product.categories ?? "").toLowerCase();

  if (/powder|supplement|protein|flour/.test(name) || /powder|supplement/.test(category)) return "scoop";
  if (/oil|sauce|ketchup|ghee/.test(name) || /oil|sauce|condiment/.test(category)) return "tbsp";
  if (/tablet|capsule|pill/.test(name) || /tablet|capsule|pharma/.test(category)) return "piece";
  if (/granola|cereal|muesli/.test(name) || /granola|cereal|breakfast/.test(category)) return "bowl";
  if (/milk|juice|soda|water|drink|beverage|cola|tea|coffee/.test(name)
      || /beverage|drink|milk|juice|water/.test(category)) return "ml";
  if (servingUnit === "ml") return "ml";
  return "g";
}

function buildUnitWeights(
  unit: DetectedUnit,
  servingSize: number | null,
  servingUnit: string | null,
  density: number | null,
): Record<string, number> {
  const weights: Record<string, number> = {};
  const d = density ?? 1.0;
  weights.g = 1;
  weights.ml = Math.round(d * 100) / 100;

  switch (unit) {
    case "ml":
      weights.glass = Math.round(240 * d);
      weights.cup = Math.round(236 * d);
      weights.bottle = Math.round(500 * d);
      if (servingSize != null && servingUnit === "ml") weights.serving = servingSize;
      break;
    case "scoop":
      weights.scoop = servingSize ?? 30;
      weights.tbsp = 15;
      break;
    case "tbsp":
      weights.tbsp = 14;
      weights.tsp = 5;
      break;
    case "piece":
      weights.piece = servingSize ?? 1;
      break;
    case "bowl":
      weights.bowl = servingSize ?? 40;
      weights.cup = Math.round(236 * d);
      break;
    case "g":
    default:
      if (servingSize != null && servingUnit === "g") weights.serving = servingSize;
      break;
  }
  return weights;
}

async function fetchFromOFO(barcode: string): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(`${OFO_BASE}/${barcode}.json`, {
      headers: {
        "User-Agent": "LeanIQA/1.0 (barcode lookup; contact@leaniqa.com)",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (body?.status !== 1 || !body?.product) return null;
    return body.product as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractNutrition(product: Record<string, unknown>) {
  const n = (product.nutriments as Record<string, unknown> | undefined) ?? {};
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const kcalRaw = n["energy-kcal_100g"];
  const kcal = kcalRaw != null ? num(kcalRaw) : num(n["energy_100g"]) / 4.184;
  return {
    kcal: Math.round(kcal * 10) / 10,
    protein: Math.round(num(n["proteins_100g"]) * 10) / 10,
    fat: Math.round(num(n["fat_100g"]) * 10) / 10,
    carbs: Math.round(num(n["carbohydrates_100g"]) * 10) / 10,
    fiber: Math.round(num(n["fiber_100g"]) * 10) / 10,
  };
}

function parseServingSize(raw: unknown): { size: number | null; unit: string | null } {
  if (typeof raw !== "string") return { size: null, unit: null };
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(g|ml)/i);
  if (!m) return { size: null, unit: null };
  return { size: Number(m[1]), unit: m[2].toLowerCase() };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "invalid_token" }, 401);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "invalid_body" }, 400);

    const barcode = String((body as { barcode?: unknown }).barcode ?? "").trim();
    if (!VALID_BARCODE.test(barcode)) {
      return json({ error: "invalid_barcode", message: "Barcode must be 8–14 digits." }, 400);
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) return json({ error: "server_misconfiguration" }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Cache hit
    const { data: cached } = await admin
      .from("barcode_cache")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();

    if (cached) {
      return json({
        barcode: cached.barcode,
        product_name: cached.product_name,
        brand: cached.brand,
        image_url: cached.image_url,
        nutrition_per_100g: cached.nutrition_per_100g,
        serving_size: cached.serving_size,
        serving_size_unit: cached.serving_size_unit,
        detected_default_unit: cached.detected_default_unit,
        unit_weights: cached.unit_weights ?? {},
        source: cached.source,
        cached: true,
      });
    }

    // 2. Fetch from Open Food Facts
    const product = await fetchFromOFO(barcode);
    if (!product) {
      return json({ error: "not_found", barcode }, 404);
    }

    const nutrition = extractNutrition(product);
    if (
      nutrition.kcal === 0 &&
      nutrition.protein === 0 &&
      nutrition.fat === 0 &&
      nutrition.carbs === 0
    ) {
      return json({ error: "no_nutrition_data", barcode }, 404);
    }

    const serving = parseServingSize(product.serving_size);
    // Fall back to serving_quantity if the string field lacks a unit
    let servingSize = serving.size;
    let servingUnit = serving.unit;
    if (servingSize == null && product.serving_quantity != null) {
      const q = Number(product.serving_quantity);
      if (Number.isFinite(q) && q > 0) {
        servingSize = q;
        servingUnit = typeof product.serving_quantity_unit === "string"
          ? product.serving_quantity_unit.toLowerCase()
          : "g";
      }
    }

    const densityRaw = Number(product.density);
    const density = Number.isFinite(densityRaw) && densityRaw > 0 ? densityRaw : null;

    const detectedUnit = detectDefaultUnit(product, servingUnit);
    const unitWeights = buildUnitWeights(detectedUnit, servingSize, servingUnit, density);

    const productName =
      (typeof product.product_name === "string" && product.product_name) ||
      (typeof product.product_name_en === "string" && product.product_name_en) ||
      null;
    const brand =
      (typeof product.brands === "string" && product.brands.split(",")[0].trim()) || null;
    const imageUrl =
      (typeof product.image_front_url === "string" && product.image_front_url) ||
      (typeof product.image_url === "string" && product.image_url) ||
      null;

    // 3. Persist to cache (best effort — never block the response)
    const { error: insertError } = await admin.from("barcode_cache").upsert(
      {
        barcode,
        product_name: productName,
        brand,
        image_url: imageUrl,
        nutrition_per_100g: nutrition,
        serving_size: servingSize,
        serving_size_unit: servingUnit,
        detected_default_unit: detectedUnit,
        unit_weights: unitWeights,
        source: "openfoodfacts",
      },
      { onConflict: "barcode" },
    );
    if (insertError) {
      console.error("Failed to cache barcode", { barcode, error: insertError.message });
    }

    return json({
      barcode,
      product_name: productName,
      brand,
      image_url: imageUrl,
      nutrition_per_100g: nutrition,
      serving_size: servingSize,
      serving_size_unit: servingUnit,
      detected_default_unit: detectedUnit,
      unit_weights: unitWeights,
      source: "openfoodfacts",
      cached: false,
    });
  } catch (err) {
    console.error("Unhandled error in lookup-barcode", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "server_error" }, 500);
  }
});