import re

with open("src/features/reports/components/motion.ts", "r") as f:
    content = f.read()

content = content.replace("type: \"spring\",", "type: \"spring\" as const,")

with open("src/features/reports/components/motion.ts", "w") as f:
    f.write(content)
