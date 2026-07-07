import re

with open("src/features/nutrition/pages/CalorieDetailPage.tsx", "r") as f:
    content = f.read()

if "import { DailyHistoryChart }" not in content:
    content = content.replace('import { reportService } from "@/features/reports/services/reportService";', 'import { reportService } from "@/features/reports/services/reportService";\nimport { DailyHistoryChart } from "../components/DailyHistoryChart";')
    with open("src/features/nutrition/pages/CalorieDetailPage.tsx", "w") as f:
        f.write(content)

with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "r") as f:
    content = f.read()

if "import { DailyHistoryChart }" not in content:
    content = content.replace('import { reportService } from "@/features/reports/services/reportService";', 'import { reportService } from "@/features/reports/services/reportService";\nimport { DailyHistoryChart } from "../components/DailyHistoryChart";')
    with open("src/features/nutrition/pages/ProteinDetailPage.tsx", "w") as f:
        f.write(content)

