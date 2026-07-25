import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { error } = await supabase.from('goals').select('deficit_kcal').limit(1);
  console.log('deficit_kcal check:', error);
  const { error: err2 } = await supabase.from('goals').select('target_weight').limit(1);
  console.log('target_weight check:', err2);
}
test();
