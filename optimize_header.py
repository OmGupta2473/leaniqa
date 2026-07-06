import re

with open('src/shared/components/Header.tsx', 'r') as f:
    content = f.read()

if "import { useMemo" not in content:
    content = content.replace("import { useEffect, useState } from 'react';", "import { useEffect, useState, useMemo } from 'react';")

old_earned = "const earnedAwards = calculateEarnedAwards(metrics);"
new_earned = "const earnedAwards = useMemo(() => calculateEarnedAwards(metrics), [metrics]);"

content = content.replace(old_earned, new_earned)

with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(content)
