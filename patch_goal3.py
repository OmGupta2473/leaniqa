import re

with open("src/features/goal/pages/GoalSetterPage.tsx", "r") as f:
    c = f.read()

c = re.sub(r"import \{ useUserStore \} from '@\/features\/profile\/store\/userStore';\nimport \{ useUserStore \} from '@\/features\/profile\/store\/userStore';", "import { useUserStore } from '@/features/profile/store/userStore';", c)

with open("src/features/goal/pages/GoalSetterPage.tsx", "w") as f:
    f.write(c)

