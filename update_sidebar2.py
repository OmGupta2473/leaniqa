import re

with open('src/shared/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Remove unused imports if they exist
content = content.replace("  const clearUserStore = useUserStore(s => s.clearUserStore);\n  \n  const queryClient = useQueryClient();", "")

# Remove handleLogout function
content = re.sub(r'  const handleLogout = async \(\) => \{\n    await authService\.logout\(\);\n  \};\n', '', content)

# Replace the button's onClick
content = content.replace("onClick={handleLogout}", "onClick={() => authService.logout()}")

with open('src/shared/components/Sidebar.tsx', 'w') as f:
    f.write(content)
