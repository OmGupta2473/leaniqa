with open('src/shared/components/Sidebar.tsx', 'r') as f:
    content = f.read()

old_logout = """  const handleLogout = async () => {
    
    clearUserStore();
    queryClient.clear();
    await authService.logout();
  };"""

new_logout = """  const handleLogout = async () => {
    await authService.logout();
  };"""

content = content.replace(old_logout, new_logout)

with open('src/shared/components/Sidebar.tsx', 'w') as f:
    f.write(content)
