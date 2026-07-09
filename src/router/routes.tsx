import { lazy, Suspense } from 'react';
import { RouteObject, Outlet, ScrollRestoration } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { RootRedirect } from './RootRedirect';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { RouteErrorBoundary } from '@/shared/components/RouteErrorBoundary';
import { ScrollHandler } from '@/shared/components/ScrollHandler';
import { ScreenSkeleton } from '@/shared/components/ScreenSkeleton';
import { RouteMetadata } from '@/shared/components/RouteMetadata';
import { AnalyticsObserver } from '@/shared/components/AnalyticsObserver';

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const MealLoggerPage = lazy(() => import('@/features/nutrition/pages/MealLoggerPage').then(module => ({ default: module.MealLoggerPage })));
const ProgressPage = lazy(() => import('@/features/progress/pages/ProgressPage').then(module => ({ default: module.ProgressPage })));
const WeeklyReportPage = lazy(() => import('@/features/reports/pages/WeeklyReportPage').then(module => ({ default: module.WeeklyReportPage })));
const PricingPage = lazy(() => import('@/features/pricing/pages/PricingPage').then(module => ({ default: module.PricingPage })));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const TransformationPage = lazy(() => import('@/features/transformation/pages/TransformationPage').then(module => ({ default: module.TransformationPage })));
const CalorieDetailPage = lazy(() => import('@/features/nutrition/pages/CalorieDetailPage').then(module => ({ default: module.CalorieDetailPage })));
const ProteinDetailPage = lazy(() => import('@/features/nutrition/pages/ProteinDetailPage').then(module => ({ default: module.ProteinDetailPage })));
const AwardsPage = lazy(() => import('@/features/awards/pages/AwardsPage').then(module => ({ default: module.AwardsPage })));
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage').then(module => ({ default: module.AuthPage })));
const OnboardingPage = lazy(() => import('@/features/onboarding/pages/OnboardingPage').then(module => ({ default: module.OnboardingPage })));
const GoalSetterPage = lazy(() => import('@/features/goal/pages/GoalSetterPage').then(module => ({ default: module.GoalSetterPage })));
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const NotFoundPage = lazy(() => import('@/shared/components/NotFoundPage').then(module => ({ default: module.NotFoundPage })));

function RootLayout() {
  return (
    <>
      <AnalyticsObserver />
      <RouteMetadata />
      <ScrollHandler />
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <GuestRoute />,
        children: [
          {
            index: true,
            element: <Suspense fallback={<ScreenSkeleton />}><LandingPage /></Suspense>,
            handle: { title: 'LeanIQA - AI Body Transformation Coach' }
          }
        ]
      },
      {
        path: '/login',
        element: <GuestRoute />,
        children: [
          { 
            index: true, 
            element: (
              <AuthLayout>
                <Suspense fallback={<ScreenSkeleton />}>
                  <AuthPage />
                </Suspense>
              </AuthLayout>
            ),
            handle: { title: 'Sign In', description: 'Log in to your LeanIQA account.' }
          }
        ]
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/onboarding', element: <Suspense fallback={<ScreenSkeleton />}><OnboardingPage /></Suspense>, handle: { title: 'Welcome', description: 'Get started with LeanIQA.' } },
              { path: '/goal', element: <Suspense fallback={<ScreenSkeleton />}><GoalSetterPage /></Suspense>, handle: { title: 'Set Goal', description: 'Set your nutrition and body goals.' } },
              { path: '/dashboard', element: <Suspense fallback={<ScreenSkeleton />}><DashboardPage /></Suspense>, handle: { title: 'Dashboard', description: 'Your daily nutrition and progress overview.' } },
              { path: '/meals', element: <Suspense fallback={<ScreenSkeleton />}><MealLoggerPage /></Suspense>, handle: { title: 'Log Meal', description: 'Log your meals and track your macros.' } },
              { path: '/progress', element: <Suspense fallback={<ScreenSkeleton />}><ProgressPage /></Suspense>, handle: { title: 'Progress', description: 'Track your long-term body transformation.' } },
              { path: '/activity', element: <Suspense fallback={<ScreenSkeleton />}><WeeklyReportPage /></Suspense>, handle: { title: 'Activity', description: 'Weekly compliance and activity report.' } },
              { path: '/profile', element: <Suspense fallback={<ScreenSkeleton />}><ProfilePage /></Suspense>, handle: { title: 'Profile', description: 'Manage your LeanIQA profile.' } },
              { path: '/pricing', element: <Suspense fallback={<ScreenSkeleton />}><PricingPage /></Suspense>, handle: { title: 'Pricing', description: 'Choose a subscription plan.' } },
              { path: '/awards', element: <Suspense fallback={<ScreenSkeleton />}><AwardsPage /></Suspense>, handle: { title: 'Awards', description: 'View your earned achievements.' } },
              { path: '/transformation', element: <Suspense fallback={<ScreenSkeleton />}><TransformationPage /></Suspense>, handle: { title: 'Transformation', description: 'Your body transformation journey.' } },
              { path: '/calorie', element: <Suspense fallback={<ScreenSkeleton />}><CalorieDetailPage /></Suspense>, handle: { title: 'Calorie Detail', description: 'Detailed breakdown of your calorie intake.' } },
              { path: '/protein', element: <Suspense fallback={<ScreenSkeleton />}><ProteinDetailPage /></Suspense>, handle: { title: 'Protein Detail', description: 'Detailed breakdown of your protein intake.' } }
            ]
          }
        ]
      },
      {
        path: '/redirect',
        element: <RootRedirect />
      },
      {
        path: '*',
        element: <Suspense fallback={<ScreenSkeleton />}><NotFoundPage /></Suspense>,
        handle: { title: 'Page Not Found', description: 'The page you are looking for does not exist.' }
      }
    ]
  }
];
