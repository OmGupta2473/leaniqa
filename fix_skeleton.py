import re

with open('src/shared/components/ScreenSkeleton.tsx', 'r') as f:
    content = f.read()

content = content.replace("export const ScreenSkeleton = memo(function ScreenSkeleton", "export function ScreenSkeleton")
content = content.replace("import { memo } from 'react';\n", "")

if content.endswith("});\n"):
    content = content[:-4] + "}\n"
elif content.endswith("});"):
    content = content[:-3] + "}"

with open('src/shared/components/ScreenSkeleton.tsx', 'w') as f:
    f.write(content)
