import { lazy, Suspense } from 'react';
import { RouteObject, Outlet, ScrollRestoration } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { RootRedirect } from './RootRedirect';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary';
import { ScrollHandler } from '../components/ScrollHandler';
import { ScreenSkeleton } from '../components/ScreenSkeleton';
import { RouteMetadata } from '../components/RouteMetadata';
import { AnalyticsObserver } from '../components/AnalyticsObserver';

const DashboardScreen = lazy(() => import('../screens/Dashboard').then(module => ({ default: module.DashboardScreen })));
const MealLoggerScreen = lazy(() => import('../screens/MealLogger').then(module => ({ default: module.MealLoggerScreen })));
const ProgressScreen = lazy(() => import('../screens/Progress').then(module => ({ default: module.ProgressScreen })));
const WeeklyReportScreen = lazy(() => import('../screens/WeeklyReport').then(module => ({ default: module.WeeklyReportScreen })));
const PricingScreen = lazy(() => import('../screens/Pricing').then(module => ({ default: module.PricingScreen })));
const ProfileScreen = lazy(() => import('../screens/Profile').then(module => ({ default: module.ProfileScreen })));
const TransformationScreen = lazy(() => import('../screens/Transformation').then(module => ({ default: module.TransformationScreen })));
const CalorieDetailScreen = lazy(() => import('../screens/CalorieDetail').then(module => ({ default: module.CalorieDetailScreen })));
const ProteinDetailScreen = lazy(() => import('../screens/ProteinDetail').then(module => ({ default: module.ProteinDetailScreen })));
const AwardsScreen = lazy(() => import('../screens/Awards').then(module => ({ default: module.AwardsScreen })));
const AuthScreen = lazy(() => import('../screens/Auth').then(module => ({ default: module.AuthScreen })));
const OnboardingScreen = lazy(() => import('../screens/Onboarding').then(module => ({ default: module.OnboardingScreen })));
const GoalSetterScreen = lazy(() => import('../screens/GoalSetter').then(module => ({ default: module.GoalSetterScreen })));
const NotFoundScreen = lazy(() => import('../screens/NotFound').then(module => ({ default: module.NotFoundScreen })));

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
        element: <RootRedirect />
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
                  <AuthScreen />
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
              { path: '/onboarding', element: <Suspense fallback={<ScreenSkeleton />}><OnboardingScreen /></Suspense>, handle: { title: 'Welcome', description: 'Get started with LeanIQA.' } },
              { path: '/goal', element: <Suspense fallback={<ScreenSkeleton />}><GoalSetterScreen /></Suspense>, handle: { title: 'Set Goal', description: 'Set your nutrition and body goals.' } },
              { path: '/dashboard', element: <Suspense fallback={<ScreenSkeleton />}><DashboardScreen /></Suspense>, handle: { title: 'Dashboard', description: 'Your daily nutrition and progress overview.' } },
              { path: '/meals', element: <Suspense fallback={<ScreenSkeleton />}><MealLoggerScreen /></Suspense>, handle: { title: 'Log Meal', description: 'Log your meals and track your macros.' } },
              { path: '/progress', element: <Suspense fallback={<ScreenSkeleton />}><ProgressScreen /></Suspense>, handle: { title: 'Progress', description: 'Track your long-term body transformation.' } },
              { path: '/activity', element: <Suspense fallback={<ScreenSkeleton />}><WeeklyReportScreen /></Suspense>, handle: { title: 'Activity', description: 'Weekly compliance and activity report.' } },
              { path: '/profile', element: <Suspense fallback={<ScreenSkeleton />}><ProfileScreen /></Suspense>, handle: { title: 'Profile', description: 'Manage your LeanIQA profile.' } },
              { path: '/pricing', element: <Suspense fallback={<ScreenSkeleton />}><PricingScreen /></Suspense>, handle: { title: 'Pricing', description: 'Choose a subscription plan.' } },
              { path: '/awards', element: <Suspense fallback={<ScreenSkeleton />}><AwardsScreen /></Suspense>, handle: { title: 'Awards', description: 'View your earned achievements.' } },
              { path: '/transformation', element: <Suspense fallback={<ScreenSkeleton />}><TransformationScreen /></Suspense>, handle: { title: 'Transformation', description: 'Your body transformation journey.' } },
              { path: '/calorie', element: <Suspense fallback={<ScreenSkeleton />}><CalorieDetailScreen /></Suspense>, handle: { title: 'Calorie Detail', description: 'Detailed breakdown of your calorie intake.' } },
              { path: '/protein', element: <Suspense fallback={<ScreenSkeleton />}><ProteinDetailScreen /></Suspense>, handle: { title: 'Protein Detail', description: 'Detailed breakdown of your protein intake.' } }
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
        element: <Suspense fallback={<ScreenSkeleton />}><NotFoundScreen /></Suspense>,
        handle: { title: 'Page Not Found', description: 'The page you are looking for does not exist.' }
      }
    ]
  }
];
