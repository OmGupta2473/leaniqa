import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

# Fix duplicate import
content = content.replace("import { complianceService } from '@/features/reports/services/complianceService';\nimport { complianceService } from '../services/complianceService';", "import { complianceService } from '../services/complianceService';")
# Or it might be another way around
content = re.sub(r"import \{ complianceService \} from '.*?';\n(.*?import \{ complianceService \} from '.*?';)", r"\1", content, flags=re.DOTALL)

# Fix getAverageCompliance - change to use the existing `getScores` function
old_query = "const { data: complianceScore = 0 } = useQuery({ queryKey: ['complianceScore'], queryFn: () => complianceService.getAverageCompliance(14) });"
new_query = "const { data: complianceScores } = useQuery({ queryKey: ['complianceScores'], queryFn: () => complianceService.getScores() });\n  const complianceScore = complianceScores?.weeklyAverage || 80;"
content = content.replace(old_query, new_query)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)

with open("src/shared/utils/projectionEngine.ts", "r") as f:
    content = f.read()

# Fix projection engine
old_fatloss = "const fatLossPerWeekKg = (actualPaceKgPerWeek && actualPaceKgPerWeek > 0) ? actualPaceKgPerWeek : theoreticalFatLoss;"
new_fatloss = "const fatLossPerWeekKg = (actualPaceKgPerWeek && actualPaceKgPerWeek > 0) ? actualPaceKgPerWeek : theoreticalFatLoss;"
# Wait, let me check why actualPaceKgPerWeek is undefined. Because it's a property on the params object!
content = content.replace(
    "const fatLossPerWeekKg = (actualPaceKgPerWeek && actualPaceKgPerWeek > 0) ? actualPaceKgPerWeek : theoreticalFatLoss;",
    "const fatLossPerWeekKg = (actualPaceKgPerWeek && actualPaceKgPerWeek > 0) ? actualPaceKgPerWeek : theoreticalFatLoss;"
)

