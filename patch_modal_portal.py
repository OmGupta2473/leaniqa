import re

with open("src/features/nutrition/components/CustomMealModal.tsx", "r") as f:
    content = f.read()

if "createPortal" not in content:
    content = content.replace("import React,", "import React, { useState, useEffect, useRef } from 'react';\nimport { createPortal } from 'react-dom';\n//")
    
    # Wrap AnimatePresence in createPortal if possible, or just the div.
    # Actually, it's easier to just wrap the whole return of AnimatePresence in createPortal
    # Wait, AnimatePresence needs to be inside the portal or outside?
    # Usually `createPortal(<AnimatePresence>...</AnimatePresence>, document.body)` works.
    
    content = content.replace(
        "return (\n    <AnimatePresence>",
        "if (typeof document === 'undefined') return null;\n\n  return createPortal(\n    <AnimatePresence>"
    )
    content = content.replace(
        "    </AnimatePresence>\n  );",
        "    </AnimatePresence>,\n    document.body\n  );"
    )

    with open("src/features/nutrition/components/CustomMealModal.tsx", "w") as f:
        f.write(content)
