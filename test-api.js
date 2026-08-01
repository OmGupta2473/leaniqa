fetch("https://hevkurreqyubqvpykisf.supabase.co/functions/v1/parse-meal", {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://leaniqa-eosin.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'baggage, sentry-trace'
  }
}).then(res => {
  console.log("Status:", res.status);
  console.log("Allow-Headers:", res.headers.get("Access-Control-Allow-Headers"));
}).catch(e => console.error(e));
