import re

with open("src/features/awards/pages/AwardsPage.tsx", "r") as f:
    content = f.read()

# Fix SMOOTH_TRANSITION
content = content.replace(
    "const SMOOTH_TRANSITION = { duration: 0.4, ease: [0.16, 1, 0.3, 1] };",
    "const SMOOTH_TRANSITION: any = { duration: 0.4, ease: [0.16, 1, 0.3, 1] };"
)

# Fix SPRING_TRANSITION
content = content.replace(
    "const SPRING_TRANSITION = { type: 'spring', stiffness: 400, damping: 30 };",
    "const SPRING_TRANSITION: any = { type: 'spring' as const, stiffness: 400, damping: 30 };"
)

# Fix containerVariants and itemVariants
content = content.replace(
    "const containerVariants =",
    "const containerVariants: any ="
)
content = content.replace(
    "const itemVariants =",
    "const itemVariants: any ="
)

with open("src/features/awards/pages/AwardsPage.tsx", "w") as f:
    f.write(content)
