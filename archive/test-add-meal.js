import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
    email: 'omgupta111k@gmail.com', // User email from prompt
    password: 'password123' // Fake, wait I can't sign in
  })
  console.log("Session err:", sessionError?.message)
}
run()
