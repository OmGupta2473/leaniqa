import re

with open("src/features/progress/pages/ProgressPage.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "`A weight change of ${diff.toFixed(1)} kg is not realistically possible. Please check your entry and try again.`",
    "`A weight change of ${diff.toFixed(1)} kg since your last logged weight is not realistically possible. Please check your entry.`"
)

with open("src/features/progress/pages/ProgressPage.tsx", "w") as f:
    f.write(content)
