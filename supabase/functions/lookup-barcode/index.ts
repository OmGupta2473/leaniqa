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

/**
 * Every provider normalises into this shape so the handler and the
 * barcode_cache table never need to know which source produced the row.
 */
interface NormalizedProduct {
  barcode: string;
  product_name: string | null;
  brand: string | null;
  image_url: string | null;
  nutrition_per_100g: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  serving_size: number | null;
  serving_size_unit: "g" | "ml" | null;
  detected_default_unit: DetectedUnit;
  unit_weights: Record<string, number>;
  source: "openfoodfacts" | "edamam" | "fatsecret" | "nutritionix" | "manual";
}

function pickName(product: Record<string, unknown>): string | null {
  const candidates = [
    product.product_name,
    product.product_name_en,
    product.product_name_hi,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

function pickBrand(product: Record<string, unknown>): string | null {
  if (typeof product.brands !== "string") return null;
  const first = product.brands.split(",")[0]?.trim();
  return first || null;
}

function pickImage(product: Record<string, unknown>): string | null {
  const candidates = [product.image_front_url, product.image_url];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  return null;
}

// ---------------------------------------------------------------- Open Food Facts
// Tries one OFF host. We call this twice: world, then India.
async function tryOpenFoodFacts(
  barcode: string,
  host: string,
): Promise<NormalizedProduct | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6_000);
  try {
    const res = await fetch(`https://${host}/api/v2/product/${barcode}.json`, {
      headers: {
        "User-Agent": "LeanIQA/1.0 (barcode lookup; contact@leaniqa.com)",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (body?.status !== 1 || !body?.product) return null;
    const product = body.product as Record<string, unknown>;

    const nutrition = extractNutrition(product);
    if (
      nutrition.kcal === 0 &&
      nutrition.protein === 0 &&
      nutrition.fat === 0 &&
      nutrition.carbs === 0
    ) {
      // The product exists but has no usable macros. Treat as a miss so the
      // next layer gets a turn instead of returning "no nutrition data".
      return null;
    }

    const serving = parseServingSize(product.serving_size);
    let servingSize = serving.size;
    let servingUnit = serving.unit;
    if (servingSize == null && product.serving_quantity != null) {
      const q = Number(product.serving_quantity);
      if (Number.isFinite(q) && q > 0) {
        servingSize = q;
        servingUnit =
          typeof product.serving_quantity_unit === "string"
            ? product.serving_quantity_unit.toLowerCase()
            : "g";
      }
    }

    const densityRaw = Number(product.density);
    const density =
      Number.isFinite(densityRaw) && densityRaw > 0 ? densityRaw : null;

    const detectedUnit = detectDefaultUnit(product, servingUnit);
    const unitWeights = buildUnitWeights(
      detectedUnit,
      servingSize,
      servingUnit,
      density,
    );

    return {
      barcode,
      product_name: pickName(product),
      brand: pickBrand(product),
      image_url: pickImage(product),
      nutrition_per_100g: nutrition,
      serving_size: servingSize,
      serving_size_unit:
        servingUnit === "g" || servingUnit === "ml" ? servingUnit : null,
      detected_default_unit: detectedUnit,
      unit_weights: unitWeights,
      source: "openfoodfacts",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}



// ---------------------------------------------------------------- Chain
async function lookupWithFallback(
  barcode: string,
): Promise<{ product: NormalizedProduct | null; attempted: string[] }> {
  const attempted: string[] = [];

  // Indian barcodes (890–899 GS1 prefix) are often filed only on the India
  // subdomain. Try world first (larger dataset), then India.
  for (const [label, host] of [
    ["openfoodfacts:world", "world.openfoodfacts.org"],
    ["openfoodfacts:in", "in.openfoodfacts.org"],
  ] as const) {
    attempted.push(label);
    const p = await tryOpenFoodFacts(barcode, host);
    if (p) return { product: p, attempted };
  }

  return { product: null, attempted };
}

function extractNutrition(
  product: Record<string, unknown>,
): { kcal: number; protein: number; fat: number; carbs: number; fiber: number } {
  const n = (product.nutriments as Record<string, unknown> | undefined) ?? {};
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  // OFF stores per-100g values under *_100g. If the contributor entered the
  // label per serving, only *_serving exists and every *_100g lookup returns
  // 0 — which is why such products currently show as "no_nutrition_data".
  // Detect that case and scale back to per-100g.
  const perServing =
    String(product.nutrition_data_per ?? "").toLowerCase() === "serving";
  let suffix = "_100g";
  let scale = 1;
  if (perServing) {
    const q = Number(product.serving_quantity);
    if (Number.isFinite(q) && q > 0) {
      suffix = "_serving";
      scale = 100 / q;
    }
  }
  const pick = (key: string) => num(n[key + suffix]) * scale;

  let kcal: number;
  if (n["energy-kcal" + suffix] != null) kcal = pick("energy-kcal");
  else if (n["energy-kj" + suffix] != null) kcal = pick("energy-kj") / 4.184;
  else kcal = pick("energy") / 4.184;

  return {
    kcal: Math.round(kcal * 10) / 10,
    protein: Math.round(pick("proteins") * 10) / 10,
    fat: Math.round(pick("fat") * 10) / 10,
    carbs: Math.round(pick("carbohydrates") * 10) / 10,
    fiber: Math.round(pick("fiber") * 10) / 10,
  };
}

function parseServingSize(raw: unknown): { size: number | null; unit: string | null } {
  if (typeof raw !== "string") return { size: null, unit: null };
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(g|ml)/i);
  if (!m) return { size: null, unit: null };
  return { size: Number(m[1]), unit: m[2].toLowerCase() };
}

// ---------------------------------------------------------------- Contribute
// Manual write-back: a user who scanned a "not found" barcode can enter the
// product name, serving size in grams, and per-serving macros. We convert
// to per-100g and store it with source='manual'. The next user who scans the
// same barcode hits the cache instantly.
//
// Body shape:
//   {
//     action: 'contribute',
//     barcode: string,
//     product_name: string,
//     brand?: string,
//     serving_size_g: number,           // grams per one serving
//     nutrition_per_serving: {
//       kcal: number, protein: number, fat: number,
//       carbs: number, fiber?: number
//     }
//   }
async function handleContribute(
  body: Record<string, unknown>,
  admin: ReturnType<typeof createClient>,
): Promise<Response> {
  const barcode = String((body as { barcode?: unknown }).barcode ?? "").trim();
  if (!VALID_BARCODE.test(barcode)) {
    return json({ error: "invalid_barcode", message: "Barcode must be 8–14 digits." }, 400);
  }

  const rawName = (body as { product_name?: unknown }).product_name;
  const productName = typeof rawName === "string" ? rawName.trim() : "";
  if (!productName) return json({ error: "invalid_product_name" }, 400);
  if (productName.length > 200) return json({ error: "product_name_too_long" }, 400);

  const rawBrand = (body as { brand?: unknown }).brand;
  const brand = typeof rawBrand === "string" && rawBrand.trim()
    ? rawBrand.trim().slice(0, 120)
    : null;

  const servingSizeG = Number((body as { serving_size_g?: unknown }).serving_size_g);
  if (!Number.isFinite(servingSizeG) || servingSizeG <= 0 || servingSizeG > 5000) {
    return json({ error: "invalid_serving_size" }, 400);
  }

  const rawNps = (body as { nutrition_per_serving?: unknown }).nutrition_per_serving;
  if (!rawNps || typeof rawNps !== "object") {
    return json({ error: "invalid_nutrition" }, 400);
  }
  const n = rawNps as Record<string, unknown>;
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : NaN);

  const kcal = num(n.kcal);
  const protein = num(n.protein);
  const fat = num(n.fat);
  const carbs = num(n.carbs);
  const fiberRaw = num(n.fiber);
  const fiber = Number.isFinite(fiberRaw) && fiberRaw >= 0 ? fiberRaw : 0;

  if (
    ![kcal, protein, fat, carbs].every(
      (v) => Number.isFinite(v) && v >= 0 && v < 10000,
    )
  ) {
    return json({ error: "invalid_nutrition" }, 400);
  }

  // Per-serving → per-100g.
  const factor = 100 / servingSizeG;
  const round1 = (v: number) => Math.round(v * factor * 10) / 10;

  const nutrition_per_100g = {
    kcal: round1(kcal),
    protein: round1(protein),
    fat: round1(fat),
    carbs: round1(carbs),
    fiber: round1(fiber),
  };

  // Manual contributions OVERWRITE any existing row for this barcode.
  // See the previous version for why `ignoreDuplicates` is deliberately off:
  // a stale/partial row from an earlier bug must be fixable, otherwise the
  // same barcode returns "not found" forever.
  //
  // Two-step verification:
  //   1. upsert with .select() → confirms the write landed and returns the
  //      persisted row.
  //   2. follow-up SELECT → confirms the row is actually readable by the
  //      service role. If (1) reported a row but (2) sees nothing, the write
  //      is being silently reverted by something (trigger, deferred
  //      constraint, connection-pool anomaly). The follow-up is cheap and
  //      turns a silent failure into a loud one.
  const upsertPayload = {
    barcode,
    product_name: productName,
    brand,
    image_url: null,
    nutrition_per_100g,
    serving_size: servingSizeG,
    serving_size_unit: "g",
    detected_default_unit: "serving",
    unit_weights: { g: 1, serving: servingSizeG },
    source: "manual",
  };

  const { data: upsertedRows, error: insertError } = await admin
    .from("barcode_cache")
    .upsert(upsertPayload, { onConflict: "barcode" })
    .select("barcode, source, serving_size");

  if (insertError) {
    console.error(JSON.stringify({
      level: "error",
      stage: "BarcodeContribute",
      event: "upsert_failed",
      barcode,
      error_message: insertError.message,
      error_code: insertError.code,
      error_details: insertError.details,
      error_hint: insertError.hint,
      payload_keys: Object.keys(upsertPayload),
    }));
    return json(
      {
        error: "db_error",
        details: insertError.message,
        code: insertError.code ?? null,
      },
      500,
    );
  }

  // Read-after-write verification.
  const { data: confirmedRow, error: confirmError } = await admin
    .from("barcode_cache")
    .select("barcode, source, serving_size, nutrition_per_100g, product_name")
    .eq("barcode", barcode)
    .maybeSingle();

  if (confirmError) {
    console.error(JSON.stringify({
      level: "error",
      stage: "BarcodeContribute",
      event: "confirm_read_failed",
      barcode,
      error_message: confirmError.message,
      error_code: confirmError.code,
    }));
    return json(
      {
        error: "db_read_back_failed",
        details: confirmError.message,
        code: confirmError.code ?? null,
      },
      500,
    );
  }

  if (!confirmedRow) {
    console.error(JSON.stringify({
      level: "error",
      stage: "BarcodeContribute",
      event: "row_missing_after_write",
      barcode,
      upsert_returned_rows: Array.isArray(upsertedRows) ? upsertedRows.length : 0,
      attempted_payload: upsertPayload,
    }));
    return json(
      {
        ok: false,
        error: "write_not_persisted",
        barcode,
        persisted: 0,
      },
      500,
    );
  }

  console.log(JSON.stringify({
    level: "info",
    stage: "BarcodeContribute",
    event: "manual_write",
    barcode,
    persisted: 1,
    source: confirmedRow.source,
    serving_size: confirmedRow.serving_size,
    kcal_per_100g: (confirmedRow.nutrition_per_100g as { kcal?: number } | null)?.kcal ?? null,
  }));

  return json({
    ok: true,
    barcode,
    source: confirmedRow.source,
    persisted: 1,
  });
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

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) return json({ error: "server_misconfiguration" }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "invalid_body" }, 400);

    const action = String((body as { action?: unknown }).action ?? "lookup")
      .trim()
      .toLowerCase();

    if (action === "contribute") {
      return await handleContribute(body as Record<string, unknown>, admin);
    }
    if (action !== "lookup") {
      return json({ error: "invalid_action" }, 400);
    }

    const barcode = String((body as { barcode?: unknown }).barcode ?? "").trim();
    if (!VALID_BARCODE.test(barcode)) {
      return json({ error: "invalid_barcode", message: "Barcode must be 8–14 digits." }, 400);
    }

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

    // 2. Multi-source lookup (cache was already checked above)
    const { product, attempted } = await lookupWithFallback(barcode);
    if (!product) {
      console.log(JSON.stringify({
        level: "info",
        stage: "BarcodeLookup",
        event: "not_found",
        barcode,
        attempted_sources: attempted,
      }));
      return json(
        { error: "not_found", barcode, attempted_sources: attempted },
        404,
      );
    }

    // 3. Persist to cache (best effort — never block the response)
    const { error: insertError } = await admin.from("barcode_cache").upsert(
      {
        barcode,
        product_name: product.product_name,
        brand: product.brand,
        image_url: product.image_url,
        nutrition_per_100g: product.nutrition_per_100g,
        serving_size: product.serving_size,
        serving_size_unit: product.serving_size_unit,
        detected_default_unit: product.detected_default_unit,
        unit_weights: product.unit_weights,
        source: product.source,
      },
      { onConflict: "barcode" },
    );
    if (insertError) {
      console.error("Failed to cache barcode", { barcode, error: insertError.message });
    }

    console.log(JSON.stringify({
      level: "info",
      stage: "BarcodeLookup",
      event: "hit",
      barcode,
      source: product.source,
      attempted_sources: attempted,
    }));

    return json({
      ...product,
      cached: false,
      attempted_sources: attempted,
    });
  } catch (err) {
    console.error("Unhandled error in lookup-barcode", {
      message: err instanceof Error ? err.message : String(err),
    });
    return json({ error: "server_error" }, 500);
  }
});
