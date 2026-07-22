import sys

with open('src/components/WheelPicker.tsx', 'r') as f:
    content = f.read()

# We need to remove the export function useWheelPhysics block from WheelPicker.tsx
start_str = "export function useWheelPhysics({"
end_str = "\n  return { y, springY, handlePanStart, handlePan, handlePanEnd, snapToNearest, isInteracting };\n}\n\n"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx:]

with open('src/components/WheelPicker.tsx', 'w') as f:
    f.write(content)

