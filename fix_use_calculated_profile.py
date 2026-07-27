import re

with open('src/shared/hooks/useCalculatedProfile.ts', 'r') as f:
    content = f.read()

content = content.replace("        if (goal.macros) {\n            data.targetMacros = goal.macros;\n        }", "")
content = content.replace("        if ((goal as any).macros) {\n            data.targetMacros = (goal as any).macros;\n        }", "")
content = re.sub(r'        if \(goal\.macros\) \{\n            data\.targetMacros = goal\.macros;\n        \}\n', '', content)

with open('src/shared/hooks/useCalculatedProfile.ts', 'w') as f:
    f.write(content)
