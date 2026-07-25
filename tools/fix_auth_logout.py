import re

with open("src/features/auth/services/authService.ts", "r") as f:
    content = f.read()

# Add useChatStore import if not present
if "import { useChatStore }" not in content:
    content = "import { useChatStore } from '@/app/store/chatStore';\n" + content

old_logout = """  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }"""

new_logout = """  async logout(): Promise<void> {
    await supabase.auth.signOut();
    useChatStore.getState().clearChatStore();
  }"""

if old_logout in content:
    content = content.replace(old_logout, new_logout)
else:
    print("Failed to find logout")
    
# also clear in the invalid user case
old_invalid = """      await supabase.auth.signOut();
      throw new AppError({"""

new_invalid = """      await supabase.auth.signOut();
      useChatStore.getState().clearChatStore();
      throw new AppError({"""

if old_invalid in content:
    content = content.replace(old_invalid, new_invalid)
else:
    print("Failed to find invalid user case")

with open("src/features/auth/services/authService.ts", "w") as f:
    f.write(content)

print("Updated authService.ts")
