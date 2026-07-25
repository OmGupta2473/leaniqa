import re

with open("src/shared/utils/projectionEngine.ts", "r") as f:
    content = f.read()

content = content.replace("  complianceScore,\n}: ProjectionParams", "  complianceScore,\n  actualPaceKgPerWeek,\n}: ProjectionParams")

with open("src/shared/utils/projectionEngine.ts", "w") as f:
    f.write(content)
