import re

with open("server.ts", "r") as f:
    content = f.read()

old_logic = """              try {
                aiResult = await fetchMistral(prompt);
                aiProvider = 'mistral';
              } catch (mistralErr: any) {
                console.error(`[Orchestrator] Mistral failed: ${mistralErr.message}. All AI engines exhausted.`);
                return res.status(500).json({ error: "Friendly Retry: We couldn't parse that meal right now. Could you be more specific or try again?" });
              }"""

new_logic = """              try {
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
              }"""

content = content.replace(old_logic, new_logic)

# Let's remove aiResult.ai_provider_used = aiProvider; so it's not exposed to frontend
content = content.replace("aiResult.ai_provider_used = aiProvider;", "// No provider name exposed")

with open("server.ts", "w") as f:
    f.write(content)
