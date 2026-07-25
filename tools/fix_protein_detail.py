import re

with open('src/features/nutrition/pages/ProteinDetailPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { useStreaks } from "@/shared/hooks/useStreaks";', 'import { useStreaks } from "@/shared/hooks/useStreaks";\nimport { calculateBestProteinStreak } from "@/shared/utils/streaks";')

pattern = re.compile(r'const allTimeBestProStreak = useMemo\(\(\) => \{.*?\}, \[metrics\]\);', re.DOTALL)
content = pattern.sub('const allTimeBestProStreak = calculateBestProteinStreak(metrics);', content)

with open('src/features/nutrition/pages/ProteinDetailPage.tsx', 'w') as f:
    f.write(content)
