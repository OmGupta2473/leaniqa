import re

HAPTICS_IMPORT = "import { haptics } from '@/shared/utils/haptics';\n"

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    c = f.read()

if "from '@/shared/utils/haptics'" not in c:
    import_end = c.rfind("import ")
    if import_end != -1:
        newline_after = c.find("\n", import_end)
        if newline_after != -1:
            c = c[:newline_after+1] + HAPTICS_IMPORT + c[newline_after+1:]

# Add haptics to award click
c = c.replace(
    "onClick={() => setSelectedAward(award)}",
    "onClick={() => {\n              if (isEarned) haptics.success();\n              else haptics.tap();\n              setSelectedAward(award);\n            }}"
)

c = c.replace(
    "onClick={() => setSelectedAward(null)}",
    "onClick={() => {\n              haptics.tap();\n              setSelectedAward(null);\n            }}"
)

with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(c)

