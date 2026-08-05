import re

with open("server.ts", "r") as f:
    content = f.read()

# 1. Insert provider status code after LRU Memory Cache
provider_code = """
// ----------------------------------------------------------------------------
// Phase 8: Rate Limit Protection
// ----------------------------------------------------------------------------
interface ProviderState {
  healthy: boolean;
  cooldownUntil: number;
  lastFailure: string;
  error429Count: number;
}

const providerStatus: Record<string, ProviderState> = {
  gemini: { healthy: true, cooldownUntil: 0, lastFailure: '', error429Count: 0 },
  groq: { healthy: true, cooldownUntil: 0, lastFailure: '', error429Count: 0 },
  mistral: { healthy: true, cooldownUntil: 0, lastFailure: '', error429Count: 0 }
};

function updateProviderHealth() {
  const now = Date.now();
  for (const p of Object.keys(providerStatus)) {
    if (!providerStatus[p].healthy && now > providerStatus[p].cooldownUntil) {
      providerStatus[p].healthy = true;
      providerStatus[p].error429Count = 0;
      console.log(`[Rate Limit] ${p} cooldown finished. Re-enabled as primary.`);
    }
  }
}

function handleProviderError(provider: string, err: any) {
  const status = err.status || 500;
  const message = (err.message || '').toLowerCase();
  
  const isTargetError = status === 429 || status === 500 || status === 408 || message.includes('timeout') || message.includes('network') || message.includes('429');
  
  providerStatus[provider].lastFailure = new Date().toISOString();
  
  if (isTargetError) {
    if (status === 429 || message.includes('429')) {
      providerStatus[provider].error429Count++;
    }
    providerStatus[provider].healthy = false;
    providerStatus[provider].cooldownUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    console.log(`[Rate Limit] ${provider} disabled for 5 minutes due to error: ${err.message}`);
  }
}

async function fetchWithRetry(provider: string, fetchFn: (prompt: string) => Promise<any>, prompt: string): Promise<any> {
  try {
    return await fetchFn(prompt);
  } catch (err: any) {
    console.error(`[Orchestrator] ${provider} failed first attempt: ${err.message}. Retrying once...`);
    try {
      return await fetchFn(prompt);
    } catch (retryErr: any) {
      console.error(`[Orchestrator] ${provider} retry failed: ${retryErr.message}.`);
      handleProviderError(provider, retryErr);
      throw retryErr;
    }
  }
}

"""

if "Phase 8: Rate Limit Protection" not in content:
    content = content.replace("const MAX_CACHE_SIZE = 1000;\n", "const MAX_CACHE_SIZE = 1000;\n" + provider_code)

old_logic = """      // Gemini Fallback Logic
      try {
        console.log(`[Orchestrator] Attempting Gemini...`);
        aiResult = await fetchGemini(prompt);
        aiProvider = 'gemini';
      } catch (geminiErr: any) {
        console.error(`[Orchestrator] Gemini failed: ${geminiErr.message}. Retrying...`);
        try {
          aiResult = await fetchGemini(prompt);
          aiProvider = 'gemini';
        } catch (geminiRetryErr: any) {
          console.error(`[Orchestrator] Gemini retry failed: ${geminiRetryErr.message}. Falling back to Groq...`);
          try {
            aiResult = await fetchGroq(prompt);
            aiProvider = 'groq';
          } catch (groqErr: any) {
            console.error(`[Orchestrator] Groq failed: ${groqErr.message}. Retrying...`);
            try {
              aiResult = await fetchGroq(prompt);
              aiProvider = 'groq';
            } catch (groqRetryErr: any) {
              console.error(`[Orchestrator] Groq retry failed: ${groqRetryErr.message}. Falling back to Mistral...`);
              try {
                aiResult = await fetchMistral(prompt);
                aiProvider = 'mistral';
              } catch (mistralErr: any) {
                console.error(`[Orchestrator] Mistral failed: ${mistralErr.message}. Retrying...`);
                try {
                  aiResult = await fetchMistral(prompt);
                  aiProvider = 'mistral';
                } catch (mistralRetryErr: any) {
                  console.error(`[Orchestrator] Mistral retry failed: ${mistralRetryErr.message}. All AI engines exhausted.`);
                  return res.status(500).json({ error: "Friendly Retry: We couldn't parse that meal right now. Could you be more specific or try again?" });
                }
              }
            }
          }
        }
      }"""

new_logic = """      // Phase 8: Rate Limit Protection & Provider Chain
      updateProviderHealth();
      
      const providers = [
        { name: 'gemini', fn: fetchGemini },
        { name: 'groq', fn: fetchGroq },
        { name: 'mistral', fn: fetchMistral }
      ];

      for (const p of providers) {
        if (providerStatus[p.name].healthy) {
           console.log(`[Orchestrator] Attempting ${p.name}...`);
           try {
             aiResult = await fetchWithRetry(p.name, p.fn, prompt);
             aiProvider = p.name;
             break; // Success
           } catch (e) {
             console.error(`[Orchestrator] ${p.name} exhausted. Falling back to next...`);
             // Move to next provider
           }
        } else {
           console.log(`[Rate Limit] Skipping ${p.name} as it is in cooldown.`);
        }
      }

      if (!aiResult) {
         console.error(`[Orchestrator] All AI engines exhausted.`);
         return res.status(500).json({ error: "Friendly Retry: We couldn't parse that meal right now. Could you be more specific or try again?" });
      }"""

content = content.replace(old_logic, new_logic)

with open("server.ts", "w") as f:
    f.write(content)

