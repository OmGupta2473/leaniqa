import re

HAPTICS_IMPORT = "import { haptics } from '@/shared/utils/haptics';\n"

with open("src/features/goal/pages/GoalSetterPage.tsx", "r") as f:
    c = f.read()

if "from '@/shared/utils/haptics'" not in c:
    import_end = c.rfind("import ")
    if import_end != -1:
        newline_after = c.find("\n", import_end)
        if newline_after != -1:
            c = c[:newline_after+1] + HAPTICS_IMPORT + c[newline_after+1:]

# In mutation onSuccess:
c = re.sub(r'(navigate\(\'/dashboard\'\);\n)', r'haptics.success();\n      \1', c)

with open("src/features/goal/pages/GoalSetterPage.tsx", "w") as f:
    f.write(c)

