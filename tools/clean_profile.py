import re

with open("src/features/profile/pages/ProfilePage.tsx", "r") as f:
    content = f.read()

# Let's remove states
content = re.sub(r'  const \[saving, setSaving\] = useState\(false\);\n', '', content)
content = re.sub(r'  const \[confirmed, setConfirmed\] = useState\(false\);\n', '', content)
content = re.sub(r'  const setActiveModal = useAppStore\(s => s.setActiveModal\);\n', '', content)
content = re.sub(r'  const setEditProfileMode = useUserStore\(s => s.setEditProfileMode\);\n', '', content)
content = re.sub(r'  const editOpen = activeModal === \'profile_edit\';\n', '', content)
content = re.sub(r'  const setEditOpen = \(isOpen: boolean\) => setActiveModal\(isOpen \? \'profile_edit\' : null\);\n', '', content)
content = re.sub(r'  const editState = useUserStore\(s => s.profileEditState\);\n', '', content)
content = re.sub(r'  const setEditState = useUserStore\(s => s.setProfileEditState\);\n', '', content)
content = re.sub(r'  const activeModal = useAppStore\(s => s.activeModal\);\n', '', content)

# Remove unused states
content = re.sub(r'  const \[name, setName\] = useState\(name_ || \'\'\);\n', '', content)
content = re.sub(r'  const \[age, setAge\] = useState\(age_ \? String\(age_\) : \'\'\);\n', '', content)
content = re.sub(r'  const \[weight, setWeight\] = useState\(weightKg_ \? String\(weightKg_\) : \'\'\);\n', '', content)
content = re.sub(r'  const \[height, setHeight\] = useState\(heightCm_ \? String\(heightCm_\) : \'\'\);\n', '', content)
content = re.sub(r'  const \[gender, setGender\] = useState<\'Male\' \| \'Female\' \| \'\'\>\(\(gender_ as any\) || \'\'\);\n', '', content)
content = re.sub(r'  const \[activity, setActivity\] = useState<any>\(activityLevel_ || \'\'\);\n', '', content)
content = re.sub(r'  const setOnboardingData = useUserStore\(s => s.setOnboardingData\);\n', '', content)

# Remove handleSave and handleReset
handle_save_pattern = r'  const handleSave = \(\) => \{.*?\n  \};\n\n  const handleReset = async \(\) => \{.*?\n  \};\n'
content = re.sub(handle_save_pattern, '', content, flags=re.DOTALL)


with open("src/features/profile/pages/ProfilePage.tsx", "w") as f:
    f.write(content)
