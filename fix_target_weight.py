import re

with open('src/features/dashboard/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

# Make sure we use a robust formatting
content = content.replace("Target: {targetWeightKg > 0 ? targetWeightKg.toFixed(2) : '--'} kg", "Target: {targetWeightKg ? Number(targetWeightKg).toFixed(1) : '--'} kg")
content = content.replace("Target: {targetWeightKg > 0 ? targetWeightKg : '--'} kg", "Target: {targetWeightKg ? Number(targetWeightKg).toFixed(1) : '--'} kg")

with open('src/features/dashboard/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)
