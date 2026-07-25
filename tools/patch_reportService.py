import re

with open('src/features/reports/services/reportService.ts', 'r') as f:
    content = f.read()

content = re.sub(r"console\.error\('Error fetching weekly reports:', error\);\s*return \[\];", "console.error('Error fetching weekly reports:', error);\n      throw error;", content)
content = re.sub(r"console\.error\('Error fetching daily metrics:', error\);\s*return \[\];", "console.error('Error fetching daily metrics:', error);\n      throw error;", content)
content = re.sub(r"console\.error\('Error saving weekly report:', error\);\s*return null;", "console.error('Error saving weekly report:', error);\n      throw error;", content)

with open('src/features/reports/services/reportService.ts', 'w') as f:
    f.write(content)

