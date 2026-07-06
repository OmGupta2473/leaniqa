import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'omgupta111k@gmail.com', // user's email
    password: 'password123' // hope this works or try to create a new user
  });
  
  // Actually let's just sign up a fake user
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'password123'
  });
  
  if (signUpErr) {
    console.error("Sign up failed", signUpErr);
    return;
  }
  
  const userId = signUpData.user?.id;
  console.log("Created user", userId);
  
  const payload = {
    id: userId,
    email: signUpData.user?.email,
    name: 'Test',
    age: 25,
    gender: 'Male',
    height: 180,
    weight: 75,
    activity_level: 'Lightly Active',
    maintenance_kcal: 2000,
    protein_target: 150
  };
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select();
    
  console.log("Full profile upsert error:", error);
  
  // Now try partial
  const { error: err2 } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: signUpData.user?.email, onboarding_completed: true }, { onConflict: 'id' });
    
  console.log("Partial profile upsert error:", err2);
}
test();
