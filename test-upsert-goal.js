import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  if (users.length === 0) return console.log("No users");
  const uid = users[0].id;
  
  const payload = {
    user_id: uid,
    current_bf: 15,
    target_bf: 10,
    strategy: 'test',
    deficit_kcal: 0,
    target_weight: 70
  };
  const { data, error } = await supabase
        .from('goals')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
  console.log(error);
}
test();
