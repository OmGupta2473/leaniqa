import sys

with open('src/components/WheelPicker.tsx', 'r') as f:
    content = f.read()

# Add blur to WheelItem
# We need useTransform for blur, but since motion doesn't natively animate filter in all versions as easily, we can use useMotionTemplate or just inline it if framer-motion supports it.
# Framer motion supports `filter`.
# Let's add `filter` useTransform

content = content.replace(
    "const rotateX = useTransform(distance, [-itemHeight * 2, 0, itemHeight * 2], [-45, 0, 45]);",
    "const rotateX = useTransform(distance, [-itemHeight * 2, 0, itemHeight * 2], [-45, 0, 45]);\n  const blurRaw = useTransform(absDistance, [0, itemHeight * 1.5, itemHeight * 3], [0, 2, 8]);\n  const filter = useTransform(blurRaw, (b) => `blur(${b}px)`);"
)

content = content.replace(
    "rotateX,",
    "rotateX,\n        filter,"
)

with open('src/components/WheelPicker.tsx', 'w') as f:
    f.write(content)

