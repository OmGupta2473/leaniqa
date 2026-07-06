import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'omgupta111k@gmail.com',
    password: 'password123'
  });
  
  if (loginErr) {
    console.error("Login err:", loginErr);
    // Can we get a session using admin key?
  }
}
test();
