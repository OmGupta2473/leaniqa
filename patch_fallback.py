import re

with open("server.ts", "r") as f:
    content = f.read()

old_loop = """        const providers = [
          { name: 'gemini', fn: fetchGemini },
          { name: 'groq', fn: fetchGroq },
          { name: 'mistral', fn: fetchMistral }
        ];

        for (const p of providers) {
          if (providerStatus[p.name].healthy) {
             console.log(`[Orchestrator] Attempting ${p.name}...`);
             try {
               finalResult = await fetchWithRetry(p.name, p.fn, prompt);
               finalResult.source = 'ai';
               finalResult.provider = p.name;
               break; // Success
             } catch (e) {
               console.error(`[Orchestrator] ${p.name} exhausted. Falling back to next...`);
             }
          } else {
             console.log(`[Rate Limit] Skipping ${p.name} as it is in cooldown.`);
          }
        }"""

new_loop = """        const providers = [
          { name: 'gemini', fn: fetchGemini },
          { name: 'groq', fn: fetchGroq },
          { name: 'mistral', fn: fetchMistral }
        ];

        let fallbackCount = 0;
        for (const p of providers) {
          if (providerStatus[p.name].healthy) {
             console.log(`[Orchestrator] Attempting ${p.name}...`);
             try {
               finalResult = await fetchWithRetry(p.name, p.fn, prompt);
               finalResult.source = 'ai';
               finalResult.provider = p.name;
               finalResult.fallbackCount = fallbackCount;
               break; // Success
             } catch (e) {
               console.error(`[Orchestrator] ${p.name} exhausted. Falling back to next...`);
               fallbackCount++;
             }
          } else {
             console.log(`[Rate Limit] Skipping ${p.name} as it is in cooldown.`);
             fallbackCount++;
          }
        }"""

content = content.replace(old_loop, new_loop)

with open("server.ts", "w") as f:
    f.write(content)
