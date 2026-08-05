import re

with open("server.ts", "r") as f:
    content = f.read()

content = content.replace("const confidence = typeof aiResult.confidence === 'number' ? aiResult.confidence : 0;",
                          "const confidenceRaw = typeof aiResult.confidence === 'number' ? aiResult.confidence : 0;\n      const confidence = confidenceRaw <= 1 && confidenceRaw > 0 ? confidenceRaw * 100 : confidenceRaw;")

with open("server.ts", "w") as f:
    f.write(content)
