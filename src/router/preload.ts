export function preloadRoute(path: string): void {
  switch (path) {
    case '/dashboard':  void import('@/features/dashboard/pages/DashboardPage'); break;
    case '/meals':      void import('@/features/nutrition/pages/MealLoggerPage'); break;
    case '/progress':   void import('@/features/progress/pages/ProgressPage'); break;
    case '/reports':    void import('@/features/reports/pages/WeeklyReportPage'); break;
    case '/profile':    void import('@/features/profile/pages/ProfilePage'); break;
    case '/awards':     void import('@/features/awards/pages/AwardsPage'); break;
    case '/pricing':    void import('@/features/pricing/pages/PricingPage'); break;
    case '/calorie':    void import('@/features/nutrition/pages/CalorieDetailPage'); break;
    case '/protein':    void import('@/features/nutrition/pages/ProteinDetailPage'); break;
    case '/onboarding': void import('@/features/onboarding/pages/OnboardingPage'); break;
    case '/science':    void import('@/features/onboarding/pages/SciencePage'); break;
    case '/login':      void import('@/features/auth/pages/AuthPage'); break;
    default: break;
  }
}
