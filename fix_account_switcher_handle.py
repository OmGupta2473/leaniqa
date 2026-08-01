with open('src/features/auth/components/AccountSwitcher.tsx', 'r') as f:
    content = f.read()

old_handle = """  const handleAddAccount = () => {
    onClose();
    navigate('/login');
  };"""

new_handle = """  const handleAddAccount = async () => {
    onClose();
    await authService.prepareAddAccount();
    window.location.href = '/login?mode=add_account';
  };"""

content = content.replace(old_handle, new_handle)

with open('src/features/auth/components/AccountSwitcher.tsx', 'w') as f:
    f.write(content)

