import re

with open('src/shared/utils/streaks.test.ts', 'r') as f:
    content = f.read()

old_metric = """    const createMetric = (dateStr: string, met: boolean): DbDailyMetric => ({
      date: dateStr,
      actual_calories: met ? 1500 : 2500,
      target_calories: 2000,
      actual_protein: met ? 150 : 100,
      target_protein: 150,"""

new_metric = """    const createMetric = (dateStr: string, met: boolean): DbDailyMetric => ({
      date: dateStr,
      actual_calories: met ? 1950 : 2500,
      target_calories: 2000,
      actual_protein: met ? 145 : 100,
      target_protein: 150,"""

if old_metric in content:
    content = content.replace(old_metric, new_metric)
    with open('src/shared/utils/streaks.test.ts', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find old_metric")

