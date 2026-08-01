import re

with open('src/features/auth/services/authService.ts', 'r') as f:
    content = f.read()

if "useMultiAccountStore" not in content:
    content = content.replace("import { useAuthStore }", "import { useMultiAccountStore } from '@/app/store/multiAccountStore';\nimport { useAuthStore }")

old_logout = """  async logout(): Promise<void> {
    await supabase.auth.signOut();
    
    // Clear all stores
    useChatStore.getState().clearChatStore();
    useAuthStore.getState().setSession(null);
    useUserStore.getState().clearUserStore();
    useAppStore.getState().clearAppStore();
    useAwardStore.getState().clearAwardStore();
    useDashboardStore.getState().clearDashboardStore();
    useNutritionStore.getState().clearNutritionStore();
    useReportStore.getState().clearReportStore();
    
    // Clear query cache
    queryClient.clear();
    
    // Reset analytics
    analytics.reset();
  }"""

new_logout = """  clearCaches() {
    useChatStore.getState().clearChatStore();
    useAuthStore.getState().setSession(null);
    useUserStore.getState().clearUserStore();
    useAppStore.getState().clearAppStore();
    useAwardStore.getState().clearAwardStore();
    useDashboardStore.getState().clearDashboardStore();
    useNutritionStore.getState().clearNutritionStore();
    useReportStore.getState().clearReportStore();
    queryClient.clear();
    analytics.reset();
  },

  async logout(logoutAll: boolean = false): Promise<void> {
    const state = useMultiAccountStore.getState();
    const activeId = state.activeAccountId;
    
    await supabase.auth.signOut();
    this.clearCaches();
    
    if (logoutAll) {
      state.clearAll();
    } else if (activeId) {
      state.removeAccount(activeId);
      // Auto-switch to another account if available
      const remainingAccounts = Object.values(useMultiAccountStore.getState().accounts);
      if (remainingAccounts.length > 0) {
        // We will just let the caller handle redirection or switching
      }
    }
  },

  async switchAccount(accountId: string): Promise<void> {
    const multiAccountStore = useMultiAccountStore.getState();
    const account = multiAccountStore.accounts[accountId];
    if (!account) throw new Error("Account not found");

    this.clearCaches();

    const { data, error } = await supabase.auth.setSession({
      access_token: account.session.access_token,
      refresh_token: account.session.refresh_token,
    });
    
    if (error) {
       // If refresh fails, they might need to log in again
       throw error;
    }

    multiAccountStore.setActiveAccount(accountId);
  }"""

content = content.replace(old_logout, new_logout)

with open('src/features/auth/services/authService.ts', 'w') as f:
    f.write(content)

print("Updated authService.ts")
