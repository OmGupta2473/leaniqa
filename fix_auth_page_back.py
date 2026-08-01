import re

with open('src/features/auth/pages/AuthPage.tsx', 'r') as f:
    content = f.read()

new_btn = """              <div className="space-y-4">
                {Object.keys(accounts).length > 0 && (
                  <motion.button 
                      whileHover={{ opacity: 0.8 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSavedAccounts(true)}
                      className="text-[14px] text-white/70 hover:text-white font-medium mb-4 flex items-center justify-center w-full"
                  >
                      ← Back to saved accounts
                  </motion.button>
                )}
                <motion.button """

content = content.replace("""              <div className="space-y-4">
                <motion.button """, new_btn)

with open('src/features/auth/pages/AuthPage.tsx', 'w') as f:
    f.write(content)
