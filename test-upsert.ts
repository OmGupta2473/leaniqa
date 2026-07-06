import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    console.log("Not authenticated, trying to log in...");
    const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });
    if (loginErr) {
        console.error("Login failed:", loginErr);
        // Let's just create a mock update attempt to see if the column exists
    }
  }

  // Actually, we can just try to update a fake ID to see if we get a column error or an RLS error
  const { data, error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Update result:", error);
}
test();
