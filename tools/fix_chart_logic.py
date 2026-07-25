import re

with open("src/features/nutrition/components/DailyHistoryChart.tsx", "r") as f:
    content = f.read()

target = """          if (type === "calorie") {
             isSuccess = day.actual <= day.target;
          } else {
             isSuccess = day.actual >= day.target;
          }"""

replacement = """          if (type === "calorie") {
             isSuccess = day.actual <= day.target && day.actual > 0;
          } else {
             isSuccess = day.actual >= day.target && day.actual > 0;
          }"""

content = content.replace(target, replacement)

# Let's also make sure the target line does not render if no target
with open("src/features/nutrition/components/DailyHistoryChart.tsx", "w") as f:
    f.write(content)
