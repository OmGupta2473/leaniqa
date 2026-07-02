import { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { useAppStore } from './store';
import { OnboardingScreen } from './screens/Onboarding';
import { GoalSetterScreen } from './screens/GoalSetter';
import { DashboardScreen } from './screens/Dashboard';
import { MealLoggerScreen } from './screens/MealLogger';
import { ProgressScreen } from './screens/Progress';
import { WeeklyReportScreen } from './screens/WeeklyReport';
import { PricingScreen } from './screens/Pricing';
import { AuthScreen } from './screens/Auth';
import { ProfileScreen } from './screens/Profile';
import { TransformationScreen } from './screens/Transformation';
import { CalorieDetailScreen } from './screens/CalorieDetail';
import { ProteinDetailScreen } from './screens/ProteinDetail';
import { AwardsScreen } from './screens/Awards';
import { useQuery } from '@tanstack/react-query';
import { profileService } from './services/profileService';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';

const TITLES: Record<string, string> = {
  auth: 'Sign In',
  onboard: 'Welcome to LeanIQA',
  goal: 'Set Your Body Goal',
  dash: 'Dashboard',
  meal: 'Nutrition Log',
  progress: 'Timeline Projection',
  week: 'Activity',
  pricing: 'Plans & pricing'
};

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import { AuthLayout } from './router/layouts/AuthLayout';
import { AppLayout } from './router/layouts/AppLayout';

export function LegacyApp() {
  const { currentScreen, setScreen, onboardingCompleted, setOnboardingCompleted, goalSetCompleted, setGoalSetCompleted, editProfileMode } = useAppStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll position to top whenever screen changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentScreen]);

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

  const { data: goal, isLoading: loadingGoal } = useQuery({
    queryKey: ['goal'],
    queryFn: () => profileService.getGoal(),
    enabled: !!session && !!profile,
  });

  const { data: dailyMetrics } = useQuery({
    queryKey: ['dailyMetrics'],
    queryFn: () => import('./services/reportService').then(m => m.reportService.getDailyMetrics()),
    enabled: !!session,
  });

  const { earnedAwards, syncFromMetrics } = useAppStore();

  useEffect(() => {
    if (dailyMetrics) {
      syncFromMetrics(dailyMetrics);
    }
  }, [dailyMetrics, syncFromMetrics]);

  // Re-sync metrics whenever the user navigates to the dashboard
  useEffect(() => {
    if (currentScreen === 'dash' && dailyMetrics) {
      syncFromMetrics(dailyMetrics);
    }
  }, [currentScreen, dailyMetrics, syncFromMetrics]);

  const todayStr = getLocalDateString();
  const hasNewAwards = earnedAwards.some(a => a.earned && a.earnedDate === todayStr);

  useEffect(() => {
    if (!loadingSession && session && !loadingProfile && !loadingGoal) {
      if (profile && !onboardingCompleted) {
        setOnboardingCompleted(true);
      }
      if (goal && !goalSetCompleted) {
        setGoalSetCompleted(true);
      }
    }

    if (!loadingSession && !session && currentScreen !== 'auth') {
      setScreen('auth');
    } else if (!loadingSession && session && !loadingProfile && !loadingGoal) {
      if (!profile && currentScreen !== 'onboard') {
        setScreen('onboard');
      } else if (profile && !goal && currentScreen !== 'goal') {
        setScreen('goal');
      } else if (profile && goal && (currentScreen === 'auth' || (currentScreen === 'onboard' && onboardingCompleted && !editProfileMode))) {
        setScreen('dash');
      }
    }
  }, [session, loadingSession, currentScreen, profile, loadingProfile, goal, loadingGoal, setScreen, onboardingCompleted, setOnboardingCompleted, goalSetCompleted, setGoalSetCompleted, editProfileMode]);

  const title = TITLES[currentScreen] || 'LeanIQA';

  if (loadingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-background-primary text-text-secondary text-[14px]">Loading...</div>;
  }

  if (currentScreen === 'auth') {
    return (
      <AuthLayout>
        <AuthScreen />
      </AuthLayout>
    );
  }

  return (
    <AppLayout>
      <div 
        ref={scrollContainerRef}
        className="app-scroll"
      >
        <ErrorBoundary>
          {currentScreen === 'onboard' && <OnboardingScreen />}
          {currentScreen === 'goal' && <GoalSetterScreen />}
          {currentScreen === 'dash' && <DashboardScreen />}
          {currentScreen === 'meal' && <MealLoggerScreen />}
          {currentScreen === 'progress' && <ProgressScreen />}
          {currentScreen === 'week' && <WeeklyReportScreen />}
          {currentScreen === 'pricing' && <PricingScreen />}
          {currentScreen === 'profile' && <ProfileScreen />}
          {currentScreen === 'transformation' && <TransformationScreen />}
          {currentScreen === 'calorieDetail' && <CalorieDetailScreen />}
          {currentScreen === 'proteinDetail' && <ProteinDetailScreen />}
          {currentScreen === 'awards' && <AwardsScreen />}
        </ErrorBoundary>
      </div>
    </AppLayout>
  );
}
