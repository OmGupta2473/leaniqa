import re

def replace_signout(file_path):
    with open(file_path, "r") as f:
        content = f.read()
    
    if "import { authService }" not in content:
        content = "import { authService } from '@/features/auth/services/authService';\n" + content
        
    content = content.replace("supabase.auth.signOut()", "authService.logout()")
    
    with open(file_path, "w") as f:
        f.write(content)

replace_signout("src/shared/components/Header.tsx")
replace_signout("src/shared/components/Sidebar.tsx")

print("Updated Header and Sidebar")
