with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

old_logout = """  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      queryClient.clear();
      haptics.success();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };"""

new_logout = """  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      haptics.success();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };"""

content = content.replace(old_logout, new_logout)

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
