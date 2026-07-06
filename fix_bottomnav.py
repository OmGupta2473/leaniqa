import re

with open('src/shared/components/BottomNav.tsx', 'r') as f:
    content = f.read()

content = content.replace("export const BottomNav = memo(function BottomNav", "export function BottomNav")
content = content.replace("import { memo } from 'react';\n", "")

if content.endswith("});\n"):
    content = content[:-4] + "}\n"
elif content.endswith("});"):
    content = content[:-3] + "}"

with open('src/shared/components/BottomNav.tsx', 'w') as f:
    f.write(content)
