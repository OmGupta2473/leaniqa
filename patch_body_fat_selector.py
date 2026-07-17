import re

with open("src/features/goal/components/BodyFatSelector.tsx", "r") as f:
    c = f.read()

# Fix haptics
c = c.replace("haptics.selection()", "haptics.tap()")

# Add maxBf prop
c = c.replace(
    "interface BodyFatSelectorProps {\n  gender: string;\n  estimatedBf: number | null;\n  value: number | null;\n  onChange: (value: number) => void;\n}",
    "interface BodyFatSelectorProps {\n  gender: string;\n  estimatedBf?: number | null;\n  value: number | null;\n  onChange: (value: number) => void;\n  maxBf?: number | null;\n}"
)

c = c.replace(
    "export function BodyFatSelector({ gender, estimatedBf, value, onChange }: BodyFatSelectorProps) {",
    "export function BodyFatSelector({ gender, estimatedBf, value, onChange, maxBf }: BodyFatSelectorProps) {"
)

c = c.replace(
    "const options = (gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f') ? femaleOptions : maleOptions;",
    "let options = (gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f') ? femaleOptions : maleOptions;\n  if (maxBf !== undefined && maxBf !== null) {\n    options = options.filter(opt => opt.mid < maxBf);\n  }"
)

with open("src/features/goal/components/BodyFatSelector.tsx", "w") as f:
    f.write(c)

