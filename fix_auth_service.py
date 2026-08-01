with open('src/features/auth/services/authService.ts', 'r') as f:
    content = f.read()

# Let's add prepareAddAccount
new_method = """
  async prepareAddAccount(): Promise<void> {
    await supabase.auth.signOut();
    this.clearCaches();
    // Intentionally do NOT remove anything from multiAccountStore
  },
"""

if 'prepareAddAccount' not in content:
    content = content.replace("  async switchAccount", new_method + "  async switchAccount")
    with open('src/features/auth/services/authService.ts', 'w') as f:
        f.write(content)
        
