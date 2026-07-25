import os

with open("supabase/functions/parse-meal/index.ts", "r") as f:
    text = f.read()

target = """    // AI Logic (Single Call)
    let attempts = 0;
    let data = null;
    let lastError = null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    while (attempts < 3 && !data) {
      try {
        attempts++;
        const aiStart = Date.now();
        
        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          user_id: userId,
          endpoint: endpoint,
          message: "AI Request Started",
          release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
        }));"""

replace = """    // AI Logic (Single Call)
    let attempts = 0;
    let data = null;
    let lastError = null;
    let aiStart = Date.now();
    
    while (attempts < 3 && !data) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      try {
        attempts++;
        aiStart = Date.now();
        
        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          endpoint: endpoint,
          message: "AI Request Started",
          release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
        }));"""

if target in text:
    text = text.replace(target, replace)
    with open("supabase/functions/parse-meal/index.ts", "w") as f:
        f.write(text)
    print("SUCCESS")
else:
    print("FAILED")
