import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Get an existing profile
  const { data: profiles, error: fetchErr } = await supabase.from('profiles').select('*').limit(1);
  if (!profiles || profiles.length === 0) {
    console.log("No profiles found");
    return;
  }
  const p = profiles[0];
  console.log("Found profile:", p);
  
  // Try to upsert
  const payload = { ...p, name: p.name + ' updated', onboarding_completed: true };
  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select();
  console.log("Upsert result:", error, data);
}
test();
