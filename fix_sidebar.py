import re

with open('src/shared/components/Sidebar.tsx', 'r') as f:
    content = f.read()

content = content.replace("export const Sidebar = memo(function Sidebar", "export function Sidebar")
content = content.replace("import { memo, useCallback } from 'react';", "import { useCallback } from 'react';")
content = content.replace("import { memo } from 'react';", "")
if content.endswith("});\\n"):
    content = content[:-4] + "}\\n"
elif content.endswith("});"):
    content = content[:-3] + "}"

# also check handleLogout
content = content.replace("const handleLogout = useCallback(async () => {", "const handleLogout = async () => {")
content = content.replace("}, [clearUserStore, queryClient]);", "};")

with open('src/shared/components/Sidebar.tsx', 'w') as f:
    f.write(content)
