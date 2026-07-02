import { lazy, Suspense } from 'react';
import { RouteObject, Outlet, ScrollRestoration } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { RootRedirect } from './RootRedirect';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LegacyApp } from '../LegacyApp';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary';
import { ScrollHandler } from '../components/ScrollHandler';
import { ScreenSkeleton } from '../components/ScreenSkeleton';

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
      <ScrollHandler />
      <ScrollRestoration />
      <LegacyApp />
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
            ) 
          }
        ]
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/onboarding', element: <Suspense fallback={<ScreenSkeleton />}><OnboardingScreen /></Suspense> },
              { path: '/goal', element: <Suspense fallback={<ScreenSkeleton />}><GoalSetterScreen /></Suspense> },
              { path: '/dashboard', element: <Suspense fallback={<ScreenSkeleton />}><DashboardScreen /></Suspense> },
              { path: '/meals', element: <Suspense fallback={<ScreenSkeleton />}><MealLoggerScreen /></Suspense> },
              { path: '/progress', element: <Suspense fallback={<ScreenSkeleton />}><ProgressScreen /></Suspense> },
              { path: '/activity', element: <Suspense fallback={<ScreenSkeleton />}><WeeklyReportScreen /></Suspense> },
              { path: '/profile', element: <Suspense fallback={<ScreenSkeleton />}><ProfileScreen /></Suspense> },
              { path: '/pricing', element: <Suspense fallback={<ScreenSkeleton />}><PricingScreen /></Suspense> },
              { path: '/awards', element: <Suspense fallback={<ScreenSkeleton />}><AwardsScreen /></Suspense> },
              { path: '/transformation', element: <Suspense fallback={<ScreenSkeleton />}><TransformationScreen /></Suspense> },
              { path: '/calorie', element: <Suspense fallback={<ScreenSkeleton />}><CalorieDetailScreen /></Suspense> },
              { path: '/protein', element: <Suspense fallback={<ScreenSkeleton />}><ProteinDetailScreen /></Suspense> }
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
        element: <Suspense fallback={<ScreenSkeleton />}><NotFoundScreen /></Suspense>
      }
    ]
  }
];
