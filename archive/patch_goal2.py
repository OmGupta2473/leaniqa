import re

with open("src/features/goal/pages/GoalSetterPage.tsx", "r") as f:
    c = f.read()

# Replace any duplicate imports
c = re.sub(r"import \{ useUserStore \} from '@\/features\/profile\/store\/userStore';\n+", "import { useUserStore } from '@/features/profile/store/userStore';\n", c)
# One might have different spacing. Let's just remove the first one and let the second stay.
c = c.replace("import { useUserStore } from '@/features/profile/store/userStore';\nimport { useUserStore } from '@/features/profile/store/userStore';", "import { useUserStore } from '@/features/profile/store/userStore';")

with open("src/features/goal/pages/GoalSetterPage.tsx", "w") as f:
    f.write(c)

