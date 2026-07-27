import re

with open('supabase/functions/generate-weekly-report/index.ts', 'r') as f:
    content = f.read()

old_cors = """const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}"""

new_cors = """function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOriginEnv = Deno.env.get("ALLOWED_ORIGIN") || "https://leaniqa.com";
  
  let allowedOrigin = "";
  if (
    origin === allowedOriginEnv ||
    origin === "https://app.leaniqa.com" ||
    origin.startsWith("http://localhost:") ||
    origin.endsWith(".vercel.app")
  ) {
    allowedOrigin = origin;
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}"""

content = content.replace(old_cors, new_cors)

old_serve = """serve(async (req) => {
  if (req.method === 'OPTIONS') {"""

new_serve = """serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {"""

content = content.replace(old_serve, new_serve)

with open('supabase/functions/generate-weekly-report/index.ts', 'w') as f:
    f.write(content)
