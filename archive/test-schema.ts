import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('daily_metrics').select('*').limit(1);
  console.log('Sample Data:', data);
  console.log('Error:', error);
}
run().catch(console.error);
