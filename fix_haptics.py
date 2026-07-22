import sys

with open('src/components/WheelPicker.tsx', 'r') as f:
    content = f.read()

content = content.replace("haptics.selection();", "haptics.tap();")

with open('src/components/WheelPicker.tsx', 'w') as f:
    f.write(content)
