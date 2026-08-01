with open('src/features/auth/pages/AuthPage.tsx', 'r') as f:
    content = f.read()

old_state = "const [showSavedAccounts, setShowSavedAccounts] = useState(Object.keys(accounts).length > 0);"

new_state = """const [showSavedAccounts, setShowSavedAccounts] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('mode') === 'add_account') return false;
    return Object.keys(accounts).length > 0;
  });"""

content = content.replace(old_state, new_state)

with open('src/features/auth/pages/AuthPage.tsx', 'w') as f:
    f.write(content)
