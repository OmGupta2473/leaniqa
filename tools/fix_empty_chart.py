import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

old_empty = """  if (chartData.length === 0) {
    chartData.push({ name: 'Start', weight: currentWeight });
  }"""

new_empty = """  if (chartData.length === 0) {
    const now = Date.now();
    chartData.push({ name: 'Start', weight: currentWeight, timestamp: now - 86400000 });
    chartData.push({ name: 'Today', weight: currentWeight, timestamp: now });
  } else if (chartData.length === 1) {
    const single = chartData[0];
    // Add a dummy point 1 day earlier so area chart renders a line
    chartData.unshift({
      name: 'Start',
      weight: single.weight,
      timestamp: single.timestamp - 86400000
    });
  }"""

content = content.replace(old_empty, new_empty)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
