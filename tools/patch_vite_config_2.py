import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

# Fix the duplicate braces issue
content = content.replace("          }\n          }\n        }\n      }\n    },\n    resolve: {", "        }\n      }\n    },\n    resolve: {")

with open('vite.config.ts', 'w') as f:
    f.write(content)
