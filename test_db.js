import fetch from 'node-fetch';

async function test() {
  try {
    const res2 = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + process.env.VITE_SUPABASE_ANON_KEY,
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      }
    });
    const schema = await res2.json();
    console.log("TABLES:", Object.keys(schema.definitions));
    if (schema.definitions.meal_logs) {
        console.log("COLUMNS:", Object.keys(schema.definitions.meal_logs.properties));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
