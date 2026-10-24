/**
 * Phase 6.1 shape verification.
 *
 * One-shot script. Signs in as the spike test user, calls parse-meal once,
 * and prints the response keys plus the three new Phase 6.1 fields. Compare
 * the output against the pre-6.1 legacy fields to confirm the flag-off path
 * is byte-identical except for `items`, `meal_confidence`, `provider`.
 *
 * Delete this file once Phase 6.1 is closed.
 */

import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const LEGACY_FIELDS = [
  'calories', 'protein', 'fat', 'carbs', 'fiber',
  'confidence', 'foods_detected', 'coaching_tip',
];
const PHASE_6_1_FIELDS = ['items', 'meal_confidence', 'provider'];

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.SPIKE_TEST_EMAIL;

  const missing: string[] = [];
  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!anon) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!service) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!email) missing.push('SPIKE_TEST_EMAIL');
  if (missing.length) {
    console.error('Missing env: ' + missing.join(', '));
    process.exit(1);
  }

  const admin = createClient(url!, service!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: email!,
  });
  if (linkErr || !link.properties?.hashed_token) {
    console.error('magic-link failed:', linkErr?.message);
    process.exit(1);
  }

  const supabase = createClient(url!, anon!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: session, error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: link.properties.hashed_token,
  });
  if (verifyErr || !session?.session) {
    console.error('otp failed:', verifyErr?.message);
    process.exit(1);
  }

  console.log('Signed in as', session.session.user.id);
  console.log('Calling parse-meal with: "2 roti and 1 katori dal"');
  console.log('');

  const t0 = performance.now();
  const { data, error } = await supabase.functions.invoke('parse-meal', {
    body: {
      text: '2 roti and 1 katori dal',
      mealType: 'lunch',
      remainingCalories: 600,
      remainingProtein: 40,
      userGoal: 'cut',
      dietaryPreference: 'unspecified',
    },
  });
  const t1 = performance.now();

  if (error) {
    // Try to read the error body
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        console.error('parse-meal error body:', JSON.stringify(body, null, 2));
      } catch {
        console.error('parse-meal error:', error.message);
      }
    } else {
      console.error('parse-meal error:', error.message);
    }
    process.exit(1);
  }

  const d = data as Record<string, unknown>;
  const keys = Object.keys(d).sort();

  console.log('Full response keys:');
  for (const k of keys) {
    const v = d[k];
    const shown =
      typeof v === 'string' ? JSON.stringify(v)
      : Array.isArray(v) ? `[${v.length} items]`
      : JSON.stringify(v);
    console.log(`  ${k}: ${shown}`);
  }
  console.log('');

  console.log('Legacy fields present (must all be present):');
  for (const k of LEGACY_FIELDS) {
    console.log(`  ${k}: ${d[k] !== undefined ? 'OK' : 'MISSING'}`);
  }
  console.log('');

  console.log('Phase 6.1 additive fields:');
  console.log(`  items:            ${JSON.stringify(d.items)}`);
  console.log(`  meal_confidence:  ${d.meal_confidence}`);
  console.log(`  provider:         ${d.provider}`);
  console.log(`  confidence:       ${d.confidence} (should equal meal_confidence on KB/cache paths)`);
  console.log('');

  console.log('Latency (round trip):', Math.round(t1 - t0), 'ms');
  console.log('Source:', d.source ?? '(not reported)');
  console.log('');

  const hasAll6_1 = PHASE_6_1_FIELDS.every((k) => d[k] !== undefined);
  const itemsIsEmpty = Array.isArray(d.items) && d.items.length === 0;
  const allLegacy = LEGACY_FIELDS.every((k) => d[k] !== undefined);

  console.log('=== Verdict ===');
  if (!hasAll6_1) console.log('❌ Missing Phase 6.1 fields');
  if (!allLegacy) console.log('❌ Missing legacy fields');
  if (!itemsIsEmpty) console.log(`⚠️  items is not empty (${JSON.stringify(d.items)}) — flag may be ON`);
  if (hasAll6_1 && allLegacy && itemsIsEmpty) {
    console.log('✅ PASS — flag-off shape confirmed.');
    console.log('   Legacy fields intact, three additive fields present, items empty.');
  }
  console.log('');
  process.exit(0);
}

main().catch((e) => {
  console.error('Unexpected:', e);
  process.exit(1);
});