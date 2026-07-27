import re

with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

# Remove isLoggingOut state
content = re.sub(r'  const \[isLoggingOut, setIsLoggingOut\] = useState\(false\);\n', '', content)

# Remove handleLogout function
content = re.sub(r'  const handleLogout = async \(\) => \{\n.*?  \};\n', '', content, flags=re.DOTALL)

# Replace the button
old_button = """        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] font-medium text-[15px] transition-colors hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <>
              <div className="w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut size={18} />
              Sign Out
            </>
          )}
        </button>"""

new_button = """        <button 
          onClick={() => authService.logout()}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] font-medium text-[15px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
        >
          <LogOut size={18} />
          Sign Out
        </button>"""

content = content.replace(old_button, new_button)

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)
