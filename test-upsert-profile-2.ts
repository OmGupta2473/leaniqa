import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const payload = {
    id: 'f9216666-4e44-42f4-a690-3b47bd6e48ab', // some fake id
    email: 'test@example.com',
    name: 'Test',
    age: 25,
    gender: 'Male',
    height: 180,
    weight: 75,
    activity_level: 'Light',
    maintenance_kcal: 2000,
    protein_target: 150
  };
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select();
  
  console.log("Upsert result:", error);
}
test();
