import re

with open('src/features/auth/services/authService.ts', 'r') as f:
    content = f.read()

new_imports = """
import { useUserStore } from '@/features/profile/store/userStore';
import { useAppStore } from '@/app/store/appStore';
import { useAwardStore } from '@/features/awards/store/awardStore';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';
import { useNutritionStore } from '@/features/nutrition/store/nutritionStore';
import { useReportStore } from '@/features/reports/store/reportStore';
import { queryClient } from '@/app/query/queryClient';
"""

content = content.replace("import { useAuthStore } from '@/app/store/authStore';", "import { useAuthStore } from '@/app/store/authStore';" + new_imports)

old_logout = """  async logout(): Promise<void> {
    await supabase.auth.signOut();
    useChatStore.getState().clearChatStore();
    useAuthStore.getState().setSession(null);
    analytics.reset();
  }"""

new_logout = """  async logout(): Promise<void> {
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

content = content.replace(old_logout, new_logout)

with open('src/features/auth/services/authService.ts', 'w') as f:
    f.write(content)
