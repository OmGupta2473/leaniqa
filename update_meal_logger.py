import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# First replace the useChatStore hooks to include initializeSession
old_hooks = """  const chatHistory = useChatStore(s => s.chatHistory);
  const addChatMessage = useChatStore(s => s.addChatMessage);
  const clearOldChats = useChatStore(s => s.clearOldChats);"""

new_hooks = """  const chatHistory = useChatStore(s => s.chatHistory);
  const addChatMessage = useChatStore(s => s.addChatMessage);
  const clearOldChats = useChatStore(s => s.clearOldChats);
  const initializeSession = useChatStore(s => s.initializeSession);"""

if old_hooks in content:
    content = content.replace(old_hooks, new_hooks)
else:
    print("Failed to find old hooks")

# Now add the useEffect just below the profile query
old_query = """  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });"""

new_query = """  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });

  useEffect(() => {
    if (profile?.id) {
      initializeSession(profile.id);
    }
  }, [profile?.id, initializeSession]);"""

if old_query in content:
    content = content.replace(old_query, new_query)
else:
    print("Failed to find profile query")

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

print("MealLoggerPage updated successfully")
