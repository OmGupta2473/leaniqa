import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  });
  if (loginErr) {
    console.error("Login failed:", loginErr);
    return;
  }
  const userId = authData.user.id;

  console.log("Upserting profile for user:", userId);
  const payload = {
    id: userId,
    email: authData.user.email,
    onboarding_completed: true
  };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .maybeSingle();
    
  console.log("Result:", error);
}
test();
