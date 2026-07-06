import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: authData, error: loginErr } = await supabase.auth.signUp({
    email: `tester-${Date.now()}@example.com`,
    password: 'password123'
  });
  
  if (loginErr) {
    console.error("Signup err", loginErr);
    return;
  }
  
  const userId = authData.user?.id;
  const email = authData.user?.email;
  console.log("Signed up", userId);
  
  const payload = {
    id: userId,
    email: email,
    name: 'Om',
    age: 22,
    gender: 'Male',
    height: 180,
    weight: 70,
    activity_level: 'Lightly Active',
    maintenance_kcal: 2000,
    protein_target: 150
  };
  
  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select();
  console.log("Upsert 1:", error, data);
  
  // Try second upsert
  const payload2 = { ...payload, age: 23, onboarding_completed: true };
  const { data: data2, error: error2 } = await supabase.from('profiles').upsert(payload2, { onConflict: 'id' }).select();
  console.log("Upsert 2:", error2, data2);
}
test();
