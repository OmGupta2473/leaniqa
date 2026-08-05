import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('meal_logs').insert({
    user_id: 'test',
    calories: 100,
    protein: 10,
    fat: 10,
    carbs: 10,
    meal_slot: 'snack'
  }).select();
  console.log(error);
}
test();
