import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('goals').upsert({ user_id: '00000000-0000-0000-0000-000000000000', current_bf: 15, target_bf: 10, strategy: 'test', deficit_kcal: 0 }, { onConflict: 'user_id' });
  console.log(error);
}
test();
