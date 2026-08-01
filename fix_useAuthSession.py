import re

with open('src/router/useAuthSession.ts', 'r') as f:
    content = f.read()

# Add import
if "useMultiAccountStore" not in content:
    content = content.replace("import { useAuthStore }", "import { useMultiAccountStore } from '@/app/store/multiAccountStore';\nimport { useAuthStore }")

# In handleSessionUser
old_handle = """    const handleSessionUser = (localSession: any) => {
      if (localSession?.user) {
        setCrashReportingUser({
          id: localSession.user.id,
          email: localSession.user.email,
        });
        analytics.identifyUser(localSession.user.id);
      } else {
        clearCrashReportingUser();
      }
    };"""

new_handle = """    const handleSessionUser = (localSession: any) => {
      if (localSession?.user) {
        setCrashReportingUser({
          id: localSession.user.id,
          email: localSession.user.email,
        });
        analytics.identifyUser(localSession.user.id);
        useMultiAccountStore.getState().addOrUpdateAccount(localSession);
      } else {
        clearCrashReportingUser();
      }
    };"""

content = content.replace(old_handle, new_handle)

with open('src/router/useAuthSession.ts', 'w') as f:
    f.write(content)

print("Updated useAuthSession.ts")
