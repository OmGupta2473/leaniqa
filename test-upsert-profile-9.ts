import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: authData, error: loginErr } = await supabase.auth.signUp({
    email: `omgupta111k+${Date.now()}@gmail.com`,
    password: 'password123'
  });
  
  const userId = authData.user?.id;
  
  // Let's create an upsert with missing NOT NULL column 'name'
  const payload = {
    id: userId,
    email: authData.user?.email,
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
    .upsert(payload, { onConflict: 'id' });
    
  console.log("Upsert missing name:", error);
}
test();
