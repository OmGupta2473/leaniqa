import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch(process.env.VITE_SUPABASE_URL + '/functions/v1/parse-meal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        text: '1 apple and 2 bananas',
        mealType: 'snack'
      })
    });
    const text = await res.text();
    console.log("RESPONSE:", res.status, text);
  } catch (e) {
    console.error(e);
  }
}
test();
