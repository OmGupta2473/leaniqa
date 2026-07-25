import re

with open('src/features/progress/services/weightService.ts', 'r') as f:
    content = f.read()

content = re.sub(r"console\.error\('Error fetching weight logs:', error\);\s*return \[\];", "console.error('Error fetching weight logs:', error);\n      throw error;", content)

with open('src/features/progress/services/weightService.ts', 'w') as f:
    f.write(content)

