import os

with open("supabase/functions/parse-meal/index.ts", "r") as f:
    text = f.read()

target1 = """    console.log(JSON.stringify({
      level: "debug",
      request_id: requestId,
      has_gemini_key: !!apiKey,
      gemini_key_prefix: apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING',
      user_id: userId.substring(0, 8),
      text_length: text?.length ?? 0,
    }));"""
replace1 = """    console.log(JSON.stringify({
      level: "debug",
      request_id: requestId,
      has_gemini_key: !!apiKey,
      text_length: text?.length ?? 0,
    }));"""

target2 = """    const endpoint = "parse-meal";
    const limit = parseInt(Deno.env.get("DAILY_AI_LIMIT") || "50", 10);
    const today = new Date().toISOString().split("T")[0];
    
    const { data: usageData, error: usageError } = await supabase
      .from("api_usage")
      .select("usage_count")
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)
      .eq("date", today)
      .maybeSingle();

    if (usageError) {
      console.warn(JSON.stringify({
        level: "warn",
        request_id: requestId,
        user_id: userId,
        endpoint: endpoint,
        message: "Database Read Failure",
        error: usageError.message,
        release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
      }));
    }

    const currentUsage = usageData?.usage_count || 0;

    if (currentUsage >= limit) {
      console.warn(JSON.stringify({
        level: "warn",
        request_id: requestId,
        user_id: userId,
        endpoint: endpoint,
        message: "Rate Limit Exceeded",
        used: currentUsage,
        limit: limit,
        release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
      }));"""
      
replace2 = """    const endpoint = "parse-meal";
    const limit = parseInt(Deno.env.get("DAILY_AI_LIMIT") || "50", 10);
    const today = new Date().toISOString().split("T")[0]; // UTC date for consistency
    
    const { data: usageData, error: usageError } = await supabase
      .from("api_usage")
      .select("usage_count")
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)
      .eq("date", today)
      .maybeSingle();

    if (usageError) {
      console.warn(JSON.stringify({
        level: "warn",
        request_id: requestId,
        endpoint: endpoint,
        message: "Database Read Failure",
        error: usageError.message,
        release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
      }));
    }

    const currentUsage = usageData?.usage_count || 0;

    if (currentUsage >= limit) {
      console.warn(JSON.stringify({
        level: "warn",
        request_id: requestId,
        endpoint: endpoint,
        message: "Rate Limit Exceeded",
        used: currentUsage,
        limit: limit,
        release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
      }));"""

target3 = """    // AI Logic (Single Call)
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

replace3 = """    // AI Logic (Single Call)
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

target4 = """        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
                foods_detected: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                coaching_tip: { type: Type.STRING },
              },
              required: [
                "calories",
                "protein",
                "fat",
                "carbs",
                "confidence",
                "foods_detected",
                "coaching_tip"
              ],
            },
          },
        });"""

replace4 = """        const aiPromise = ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
                foods_detected: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                coaching_tip: { type: Type.STRING },
              },
              required: [
                "calories",
                "protein",
                "fat",
                "carbs",
                "confidence",
                "foods_detected",
                "coaching_tip"
              ],
            },
          },
        });
        
        const response = await Promise.race([
          aiPromise,
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              reject(new DOMException("Timeout", "AbortError"));
            });
          })
        ]);"""

target5 = """        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          user_id: userId,
          endpoint: endpoint,
          ai_duration_ms: aiLatency,
          attempts: attempts
        }));

        const parsed = JSON.parse(response.text || "{}");
        data = MealSchema.parse(parsed);
        clearTimeout(timeoutId);
        
        const { error: incrementError } = await supabase.rpc("increment_api_usage", {
          p_user_id: user.id,
          p_endpoint: endpoint
        });
        
        if (incrementError) {
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            user_id: userId,
            endpoint: endpoint,
            message: "Database Write Failure",
            error: incrementError.message,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
        }
        
        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          user_id: userId,
          endpoint: endpoint,
          message: "AI Request Succeeded",
          latency: aiLatency,
          release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
        }));
        
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          console.error("AI Request timed out");
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            user_id: userId,
            endpoint: endpoint,
            message: "AI Request Failed",
            error: "Timeout",
            latency: Date.now() - aiStart,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
          break;
        }
        if (attempts >= 3) {
          console.error("Gemini failed after 3 attempts", err);
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            user_id: userId,
            endpoint: endpoint,
            message: "AI Request Failed",
            error: err.message,
            latency: Date.now() - aiStart,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
          break;
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 500)); // Exponential backoff: 1s, 2s
      }
    }"""

replace5 = """        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          endpoint: endpoint,
          ai_duration_ms: aiLatency,
          attempts: attempts
        }));

        const parsed = JSON.parse(response.text || "{}");
        data = MealSchema.parse(parsed);
        
        const { error: incrementError } = await supabase.rpc("increment_api_usage", {
          p_user_id: user.id,
          p_endpoint: endpoint,
          p_date: today
        });
        
        if (incrementError) {
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            endpoint: endpoint,
            message: "Database Write Failure",
            error: incrementError.message,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
        }
        
        console.log(JSON.stringify({
          level: "info",
          request_id: requestId,
          endpoint: endpoint,
          message: "AI Request Succeeded",
          latency: aiLatency,
          release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
        }));
        
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          console.error("AI Request timed out");
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            endpoint: endpoint,
            message: "AI Request Failed",
            error: "Timeout",
            latency: Date.now() - aiStart,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
          break;
        }
        if (attempts >= 3) {
          console.error("Gemini failed after 3 attempts", err);
          console.error(JSON.stringify({
            level: "error",
            request_id: requestId,
            endpoint: endpoint,
            message: "AI Request Failed",
            error: err.message,
            latency: Date.now() - aiStart,
            release_version: Deno.env.get("RELEASE_VERSION") || "unknown"
          }));
          break;
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 500)); // Exponential backoff: 1s, 2s
      } finally {
        clearTimeout(timeoutId);
      }
    }"""

target6 = """    console.warn(JSON.stringify({
      level: "warn",
      request_id: requestId,
      user_id: userId,
      endpoint: "parse-meal",
      message: "AI failed, falling back to basic DB estimate",
      error: error.message
    }));"""
replace6 = """    console.warn(JSON.stringify({
      level: "warn",
      request_id: requestId,
      endpoint: "parse-meal",
      message: "AI failed, falling back to basic DB estimate",
      error: error.message
    }));"""

target7 = """  } finally {
     console.log(JSON.stringify({
       level: "info",
       request_id: requestId,
       user_id: userId,
       latency_ms: Date.now() - startTime
     }));
  }"""
replace7 = """  } finally {
     console.log(JSON.stringify({
       level: "info",
       request_id: requestId,
       latency_ms: Date.now() - startTime
     }));
  }"""

for i, (t, r) in enumerate([
    (target1, replace1), (target2, replace2), (target3, replace3),
    (target4, replace4), (target5, replace5), (target6, replace6),
    (target7, replace7)
]):
    if t in text:
        text = text.replace(t, r)
        print(f"Match {i+1}: SUCCESS")
    else:
        print(f"Match {i+1}: FAILED")

with open("supabase/functions/parse-meal/index.ts", "w") as f:
    f.write(text)

