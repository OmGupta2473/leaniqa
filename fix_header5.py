import re

with open('src/shared/components/Header.tsx', 'r') as f:
    lines = f.readlines()

# let's just find the closing tags and fix it.
with open('src/shared/components/Header.tsx', 'w') as f:
    found = False
    for i, line in enumerate(lines):
        if "profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'ME'" in line:
            f.write(line)
            f.write("        </div>\n")
            f.write("      </div>\n")
            f.write("      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />\n")
            f.write("    </motion.div>\n")
            f.write("  );\n")
            f.write("}\n")
            break
        else:
            f.write(line)

print("Fixed Header.tsx")
