import re

with open('src/shared/components/Header.tsx', 'r') as f:
    content = f.read()

if "import { AccountSwitcher }" not in content:
    content = content.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\nimport { AccountSwitcher } from '@/features/auth/components/AccountSwitcher';\nimport { useLongPress } from '@/shared/hooks/useLongPress';")

# Add useState for account switcher
if "const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);" not in content:
    content = content.replace("const [session, setSession] = useState(null);", "const [session, setSession] = useState(null);\n  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);")

old_profile = """        <div 
          className="rounded-full flex items-center justify-center text-[12px] font-medium"
          onClick={() => {
            if (hasCompletedOnboarding !== false) navigate('/profile');
          }}
          style={{ 
            cursor: hasCompletedOnboarding === false ? 'not-allowed' : 'pointer',
            background: 'rgba(212,255,0,0.12)',
            color: '#D4FF00',
            width: '32px',
            height: '32px'
          }}
        >
          {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'ME'}
        </div>"""

new_profile = """        <div 
          className="rounded-full flex items-center justify-center text-[12px] font-medium select-none"
          {...useLongPress(
            () => {
              if (hasCompletedOnboarding !== false) setShowAccountSwitcher(true);
            },
            () => {
              if (hasCompletedOnboarding !== false) navigate('/profile');
            }
          )}
          style={{ 
            cursor: hasCompletedOnboarding === false ? 'not-allowed' : 'pointer',
            background: 'rgba(212,255,0,0.12)',
            color: '#D4FF00',
            width: '32px',
            height: '32px',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'ME'}
        </div>
      </div>
      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />"""

if old_profile in content:
    # Need to properly match the closing tag </div></div></motion.div>
    content = content.replace(old_profile, new_profile)
    content = content.replace("</div>\n      <AccountSwitcher", "  </div>\n      </div>\n      <AccountSwitcher")
else:
    print("Could not find profile div in Header.tsx")

with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(content)

print("Updated Header.tsx")
