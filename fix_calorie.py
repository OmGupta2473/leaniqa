import re

with open("src/features/nutrition/pages/CalorieDetailPage.tsx", "r") as f:
    content = f.read()

# Add import
import_pattern = r'import \{ reportService \} from "@/features/reports/services/reportService";'
content = content.replace(import_pattern, import_pattern + '\nimport { DailyHistoryChart } from "../components/DailyHistoryChart";')

# Replace chart logic
chart_build_pattern = r'  // Build chart.*?const chartHtml = buildCalorieBarChart\(chartLogs, dailyCalorieGoal\);\n'
content = re.sub(chart_build_pattern, '', content, flags=re.DOTALL)

# Map chartLogs format to what DailyHistoryChart expects
chart_map_injection = """  const chartData = useMemo(() => {
    return chartLogs.map(l => ({
      date: l.date,
      actual: l.actual_calories,
      target: l.target_calories
    }));
  }, [chartLogs]);

"""

content = content.replace('return (', chart_map_injection + '  return (')

# Replace the old chart HTML section in JSX
jsx_chart_pattern = r'        \{\/\* Bar chart section \*\/.*?<div style=\{\{ fontSize: "11px", color: "rgba\(235,235,245,0\.5\)", fontStyle: "italic", marginLeft: "4px", marginTop: "-16px", marginBottom: "32px" \}\}>\n          \* Still in calculation. Today\'s result will be finalized at the end of the day.\n        </div>'

jsx_replacement = """        {/* Bar chart section */}
        <div className="mb-[12px] text-[13px] font-semibold uppercase tracking-[0.05em] text-[#EBEBF599] ml-[4px]">
          Daily calorie history
        </div>
        
        <DailyHistoryChart 
          logs={chartData} 
          todayStr={todayStr} 
          unit="kcal" 
          type="calorie" 
        />

        <div style={{ fontSize: "11px", color: "rgba(235,235,245,0.5)", fontStyle: "italic", marginLeft: "4px", marginTop: "-8px", marginBottom: "32px" }}>
          * Still in calculation. Today's result will be finalized at the end of the day.
        </div>"""

content = re.sub(jsx_chart_pattern, jsx_replacement, content, flags=re.DOTALL)

with open("src/features/nutrition/pages/CalorieDetailPage.tsx", "w") as f:
    f.write(content)
