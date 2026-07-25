import re

with open('src/shared/components/Header.tsx', 'r') as f:
    content = f.read()

content = content.replace("export const Header = memo(function Header", "export function Header")
content = content.replace("const earnedAwards = useMemo(() => calculateEarnedAwards(metrics), [metrics]);", "const earnedAwards = calculateEarnedAwards(metrics);")
content = content.replace("import { memo } from 'react';\n", "")

if content.endswith("});\n"):
    content = content[:-4] + "}\n"
elif content.endswith("});"):
    content = content[:-3] + "}"

with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(content)
