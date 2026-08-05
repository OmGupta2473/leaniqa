import re

with open("src/features/nutrition/components/CustomMealModal.tsx", "r") as f:
    content = f.read()

content = content.replace("defaultSlot?: 'breakfast' | 'lunch' | 'dinner' | '';", "defaultSlot?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | '';")
content = content.replace("const [slot, setSlot] = useState<'breakfast' | 'lunch' | 'dinner'>(defaultSlot as 'breakfast' | 'lunch' | 'dinner' || 'lunch');", "const [slot, setSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(defaultSlot as 'breakfast' | 'lunch' | 'dinner' | 'snack' || 'lunch');")
content = content.replace("['breakfast', 'lunch', 'dinner'].includes(defaultSlot)", "['breakfast', 'lunch', 'dinner', 'snack'].includes(defaultSlot)")
content = content.replace("setSlot(defaultSlot as 'breakfast' | 'lunch' | 'dinner');", "setSlot(defaultSlot as 'breakfast' | 'lunch' | 'dinner' | 'snack');")
content = content.replace("['breakfast', 'lunch', 'dinner'].map", "['breakfast', 'lunch', 'dinner', 'snack'].map")

with open("src/features/nutrition/components/CustomMealModal.tsx", "w") as f:
    f.write(content)
