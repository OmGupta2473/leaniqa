import re

with open('src/features/auth/components/AccountSwitcher.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { createPortal }" not in content:
    content = content.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\nimport { createPortal } from 'react-dom';")

# Replace return
if "return createPortal(" not in content:
    content = content.replace("  return (\n    <AnimatePresence>", "  if (typeof document === 'undefined') return null;\n  return createPortal(\n    <AnimatePresence>")
    content = content.replace("    </AnimatePresence>\n  );\n}", "    </AnimatePresence>,\n    document.body\n  );\n}")

with open('src/features/auth/components/AccountSwitcher.tsx', 'w') as f:
    f.write(content)

print("Updated AccountSwitcher.tsx")
