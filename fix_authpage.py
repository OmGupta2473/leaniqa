import re

with open('src/features/auth/pages/AuthPage.tsx', 'r') as f:
    content = f.read()

# Add imports
if "import { useMultiAccountStore }" not in content:
    content = content.replace("import { useState, FormEvent } from 'react';", "import { useState, FormEvent, useEffect } from 'react';\nimport { useMultiAccountStore } from '@/app/store/multiAccountStore';\nimport { Check, X, Loader2, Plus, LogOut } from 'lucide-react';\nimport { authService } from '@/features/auth/services/authService';")

# Get accounts
if "const { accounts } = useMultiAccountStore();" not in content:
    content = content.replace("const [showEmailSuggestion, setShowEmailSuggestion] = useState(false);", "const [showEmailSuggestion, setShowEmailSuggestion] = useState(false);\n  const { accounts, activeAccountId } = useMultiAccountStore();\n  const [showSavedAccounts, setShowSavedAccounts] = useState(Object.keys(accounts).length > 0);\n  const [switchingTo, setSwitchingTo] = useState<string | null>(null);")

handle_switch = """
  const handleSwitchAccount = async (id: string) => {
    setSwitchingTo(id);
    try {
      await authService.switchAccount(id);
      window.location.href = getRedirectUrl();
    } catch (e) {
      console.error('Failed to switch account:', e);
      toast({ type: 'error', message: 'Session expired. Please log in again.' });
      useMultiAccountStore.getState().removeAccount(id);
    } finally {
      setSwitchingTo(null);
    }
  };

  const handleRemoveSavedAccount = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    useMultiAccountStore.getState().removeAccount(id);
    if (Object.keys(useMultiAccountStore.getState().accounts).length === 0) {
      setShowSavedAccounts(false);
    }
  };
"""

if handle_switch not in content:
    content = content.replace("const getRedirectUrl = () => {", handle_switch + "\n  const getRedirectUrl = () => {")


# Insert Saved Accounts UI
saved_accounts_ui = """
          {showSavedAccounts && Object.keys(accounts).length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-[rgba(28,28,30,0.6)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-[24px] overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h2 className="text-[15px] font-semibold text-white/90">Saved Accounts</h2>
                </div>
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {Object.values(accounts).map(account => (
                    <button
                      key={account.id}
                      onClick={() => handleSwitchAccount(account.id)}
                      disabled={!!switchingTo}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg bg-white/5 text-white/70 overflow-hidden">
                          {account.avatar_url ? (
                            <img src={account.avatar_url} alt={account.name} className="w-full h-full object-cover" />
                          ) : (
                            account.name ? account.name.substring(0, 2).toUpperCase() : 'ME'
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-[15px] font-medium text-white truncate">{account.name || 'User'}</span>
                          <span className="text-[13px] text-white/50 truncate">{account.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {switchingTo === account.id && <Loader2 size={18} className="animate-spin text-white/50" />}
                        {switchingTo !== account.id && (
                          <div
                            onClick={(e) => handleRemoveSavedAccount(e, account.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <LogOut size={16} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowSavedAccounts(false)}
                className="btn-ghost w-full"
              >
                Log into another account
              </button>
            </motion.div>
          ) : (
"""

if "showSavedAccounts && Object.keys(accounts).length > 0" not in content:
    content = content.replace('<div className="space-y-4">', saved_accounts_ui + '\n<div className="space-y-4">')
    content = content.replace('</form>', '</form>\n)}')

with open('src/features/auth/pages/AuthPage.tsx', 'w') as f:
    f.write(content)

print("Updated AuthPage.tsx")
