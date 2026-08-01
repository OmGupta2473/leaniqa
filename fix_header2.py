import re

with open('src/shared/components/Header.tsx', 'r') as f:
    content = f.read()

content = content.replace("        </div>\n      </div>\n      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />\n      </div>\n    </motion.div>", "        </div>\n      </div>\n      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />\n    </motion.div>")

with open('src/shared/components/Header.tsx', 'w') as f:
    f.write(content)

print("Updated Header.tsx")
