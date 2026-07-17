import re

def insert_import(file_path, imp_statement):
    with open(file_path, "r") as f:
        c = f.read()
    if imp_statement not in c:
        c = imp_statement + "\n" + c
    with open(file_path, "w") as f:
        f.write(c)

insert_import("src/features/profile/pages/ProfilePage.tsx", "import { useUserStore } from '@/features/profile/store/userStore';")
insert_import("src/features/profile/pages/ProfilePage.tsx", "import { useChatStore } from '@/app/store';")

with open("src/features/goal/pages/GoalSetterPage.tsx", "r") as f:
    c = f.read()
# Fix duplicate import
c = re.sub(r"import \{ useUserStore \} from '@\/features\/profile\/store\/userStore';\n+", "import { useUserStore } from '@/features/profile/store/userStore';\n", c)
with open("src/features/goal/pages/GoalSetterPage.tsx", "w") as f:
    f.write(c)

