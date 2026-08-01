import sys

with open('supabase/functions/parse-meal/index.ts', 'r') as f:
    content = f.read()

target = """    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type","""
replacement = """    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, baggage, sentry-trace","""

if target in content:
    content = content.replace(target, replacement)
    with open('supabase/functions/parse-meal/index.ts', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found!")
