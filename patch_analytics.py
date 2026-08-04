with open("src/shared/utils/analytics.ts", "r") as f:
    content = f.read()

content = content.replace(
    "| 'AI Parse Failure'",
    "| 'AI Parse Failure'\n  | 'Custom Meal Logged'"
)

with open("src/shared/utils/analytics.ts", "w") as f:
    f.write(content)
