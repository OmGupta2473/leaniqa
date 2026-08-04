const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hevkurreqyubqvpykisf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhldmt1cnJlcXl1YnF2cHlraXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDg4NDMsImV4cCI6MjA5Nzg4NDg0M30.Xjs_cGs21YzLA-LUM2CJlAWwT9cLhLtanYC8Pfkhw-4';

async function test() {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/parse-meal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "1 scoop alpha whey protein",
        remainingCalories: 2000,
        remainingProtein: 150,
        mealType: "lunch"
      })
    });
    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Response:", data);
  } catch (e) {
    console.error(e);
  }
}
test();
