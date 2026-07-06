import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

async function test() {
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: 'f9216666-4e44-42f4-a690-3b47bd6e48ab',
      email: 'test@example.com',
      name: 'Test',
      age: 25,
      gender: 'Male',
      height: 180,
      weight: 75,
      activity_level: 'Light',
      maintenance_kcal: 2000,
      protein_target: 150
    })
  });
  console.log(res.status);
  console.log(await res.json());
}
test();
