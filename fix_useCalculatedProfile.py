import re

with open('src/shared/hooks/useCalculatedProfile.ts', 'r') as f:
    content = f.read()

old_if = """        if (finalWater) {
          data.waterLitres = finalWater;
        }"""

new_if = """        if (finalWater !== null) {
          data.waterLitres = finalWater;
        }"""

content = content.replace(old_if, new_if)

with open('src/shared/hooks/useCalculatedProfile.ts', 'w') as f:
    f.write(content)

