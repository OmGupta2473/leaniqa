import { Sidebar } from './components/Sidebar';
import { useAppStore } from './store';
import { OnboardingScreen } from './screens/Onboarding';
import { DashboardScreen } from './screens/Dashboard';
import { MealLoggerScreen } from './screens/MealLogger';
import { ProgressScreen } from './screens/Progress';
import { WeeklyReportScreen } from './screens/WeeklyReport';
import { PricingScreen } from './screens/Pricing';

const TITLES: Record<string, string> = {
  onboard: 'Welcome to Physique AI',
  dash: 'Dashboard',
  meal: 'Nutrition Log',
  progress: 'Timeline Projection',
  week: 'Weekly Reports',
  pricing: 'Plans & pricing'
};

export default function App() {
  const { currentScreen, profile } = useAppStore();

  const title = TITLES[currentScreen] || 'Physique AI';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex h-[640px] w-full max-w-md border-[0.5px] border-border-tertiary rounded-xl overflow-hidden bg-background-primary shadow-2xl">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden relative bg-background-primary">
          <div className="px-5 py-4 border-b-[0.5px] border-border-tertiary flex items-center justify-between shrink-0 bg-background-primary z-10">
            <div className="text-[15px] font-medium text-text-primary">{title}</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-bg flex items-center justify-center text-[12px] font-medium text-purple">
                {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'ME'}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 scroll-smooth">
            {currentScreen === 'onboard' && <OnboardingScreen />}
            {currentScreen === 'dash' && <DashboardScreen />}
            {currentScreen === 'meal' && <MealLoggerScreen />}
            {currentScreen === 'progress' && <ProgressScreen />}
            {currentScreen === 'week' && <WeeklyReportScreen />}
            {currentScreen === 'pricing' && <PricingScreen />}
          </div>
        </div>
      </div>
    </div>
  );
}
