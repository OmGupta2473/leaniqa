import { RouteObject, Outlet, ScrollRestoration } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { RootRedirect } from './RootRedirect';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardScreen } from '../screens/Dashboard';
import { MealLoggerScreen } from '../screens/MealLogger';
import { ProgressScreen } from '../screens/Progress';
import { WeeklyReportScreen } from '../screens/WeeklyReport';
import { PricingScreen } from '../screens/Pricing';
import { ProfileScreen } from '../screens/Profile';
import { TransformationScreen } from '../screens/Transformation';
import { CalorieDetailScreen } from '../screens/CalorieDetail';
import { ProteinDetailScreen } from '../screens/ProteinDetail';
import { AwardsScreen } from '../screens/Awards';
import { AuthScreen } from '../screens/Auth';
import { OnboardingScreen } from '../screens/Onboarding';
import { GoalSetterScreen } from '../screens/GoalSetter';
import { LegacyApp } from '../LegacyApp';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary';
import { NotFoundScreen } from '../screens/NotFound';
import { ScrollHandler } from '../components/ScrollHandler';

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
                <AuthScreen />
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
              { path: '/onboarding', element: <OnboardingScreen /> },
              { path: '/goal', element: <GoalSetterScreen /> },
              { path: '/dashboard', element: <DashboardScreen /> },
              { path: '/meals', element: <MealLoggerScreen /> },
              { path: '/progress', element: <ProgressScreen /> },
              { path: '/activity', element: <WeeklyReportScreen /> },
              { path: '/profile', element: <ProfileScreen /> },
              { path: '/pricing', element: <PricingScreen /> },
              { path: '/awards', element: <AwardsScreen /> },
              { path: '/transformation', element: <TransformationScreen /> },
              { path: '/calorie', element: <CalorieDetailScreen /> },
              { path: '/protein', element: <ProteinDetailScreen /> }
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
        element: <NotFoundScreen />
      }
    ]
  }
];
