import re

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace("finalResult = await fetchWithRetry(p.name, p.fn, prompt);\n               finalResult.source = 'ai';",
                          "finalResult = await fetchWithRetry(p.name, p.fn, prompt);\n               finalResult.source = 'ai';\n               finalResult.provider = p.name;")

with open("server.ts", "w") as f:
    f.write(content)
