with open('src/features/awards/pages/AwardsPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('feGaussianBlur stdDeviation="${s * 0.08}"', 'feGaussianBlur stdDeviation="${s * 0.04}"')

with open('src/features/awards/pages/AwardsPage.tsx', 'w') as f:
    f.write(content)
