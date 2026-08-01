with open('src/features/auth/components/AccountSwitcher.tsx', 'r') as f:
    content = f.read()

old_remove = """  const handleRemoveAccount = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (savedAccounts.length === 1) {
      await authService.logout(true);
      window.location.href = '/login';
      return;
    }
    
    if (id === activeAccountId) {
      await authService.logout(false);
      window.location.href = '/login';
    } else {
      useMultiAccountStore.getState().removeAccount(id);
    }
  };"""

new_remove = """  const handleRemoveAccount = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // Just remove the account from the store if it's not the active one
    if (id === activeAccountId) {
      // If they remove the currently active account, log them out
      await authService.logout(false);
      window.location.href = '/login';
    } else {
      useMultiAccountStore.getState().removeAccount(id);
    }
  };"""

content = content.replace(old_remove, new_remove)

with open('src/features/auth/components/AccountSwitcher.tsx', 'w') as f:
    f.write(content)
