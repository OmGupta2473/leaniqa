import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Sidebar } from './components/Sidebar';
import { useAppStore } from './store';
import { OnboardingScreen } from './screens/Onboarding';
import { GoalSetterScreen } from './screens/GoalSetter';
import { DashboardScreen } from './screens/Dashboard';
import { MealLoggerScreen } from './screens/MealLogger';
import { ProgressScreen } from './screens/Progress';
import { WeeklyReportScreen } from './screens/WeeklyReport';
import { PricingScreen } from './screens/Pricing';
import { AuthScreen } from './screens/Auth';
import { useQuery } from '@tanstack/react-query';
import { profileService } from './services/profileService';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNetworkStatus } from './lib/utils';
import { WifiOff } from 'lucide-react';

const TITLES: Record<string, string> = {
  auth: 'Sign In',
  onboard: 'Welcome to Physique AI',
  goal: 'Set Your Physique Goal',
  dash: 'Dashboard',
  meal: 'Nutrition Log',
  progress: 'Timeline Projection',
  week: 'Weekly Reports',
  pricing: 'Plans & pricing'
};

export default function App() {
  const { currentScreen, setScreen } = useAppStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!session,
  });

  useEffect(() => {
    if (!loadingSession && !session && currentScreen !== 'auth') {
      setScreen('auth');
    } else if (!loadingSession && session && !loadingProfile) {
      if (!profile && currentScreen !== 'onboard') {
        setScreen('onboard');
      } else if (profile && (currentScreen === 'auth' || currentScreen === 'onboard')) {
        setScreen('dash');
      }
    }
  }, [session, loadingSession, currentScreen, profile, loadingProfile, setScreen]);

  const title = TITLES[currentScreen] || 'Physique AI';

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-background-primary text-text-secondary text-[14px]">Loading...</div>;
  }

  if (currentScreen === 'auth') {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {!isOnline && (
        <div className="w-full max-w-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs py-2 px-4 rounded-t-xl flex items-center justify-center gap-2 mb-[-8px] pb-4 z-0">
          <WifiOff size={14} />
          You're offline — data may not update
        </div>
      )}
      <div className="flex h-[640px] w-full max-w-md border-[0.5px] border-border-tertiary rounded-xl overflow-hidden bg-background-primary shadow-2xl z-10 relative">
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
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 scroll-smooth relative">
            <ErrorBoundary>
              {currentScreen === 'onboard' && <OnboardingScreen />}
              {currentScreen === 'goal' && <GoalSetterScreen />}
              {currentScreen === 'dash' && <DashboardScreen />}
              {currentScreen === 'meal' && <MealLoggerScreen />}
              {currentScreen === 'progress' && <ProgressScreen />}
              {currentScreen === 'week' && <WeeklyReportScreen />}
              {currentScreen === 'pricing' && <PricingScreen />}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
