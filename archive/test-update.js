import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: { users }, error: authErr } = await supabase.auth.admin?.listUsers() || { data: {users: []} };
  // just try an update
  const { data, error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('email', 'omgupta111k@gmail.com')
    .select();
  console.log(error, data);
}
test();
