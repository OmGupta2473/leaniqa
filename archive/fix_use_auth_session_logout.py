import re

with open("src/router/useAuthSession.ts", "r") as f:
    content = f.read()

# Add useChatStore import if not present
if "import { useChatStore }" not in content:
    content = "import { useChatStore } from '@/app/store/chatStore';\n" + content

content = content.replace("await supabase.auth.signOut();", "await supabase.auth.signOut();\n            useChatStore.getState().clearChatStore();")

with open("src/router/useAuthSession.ts", "w") as f:
    f.write(content)

print("Updated useAuthSession.ts")
