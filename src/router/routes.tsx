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
import { DashboardSkeleton, MealLoggerSkeleton, ProgressSkeleton, WeeklyReportSkeleton, ProfileSkeleton, NutritionDetailSkeleton, AwardsSkeleton } from '@/shared/components/Skeletons';
import { PageSkeleton } from '@/shared/components/PageSkeleton';

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const MealLoggerPage = lazy(() => import('@/features/nutrition/pages/MealLoggerPage').then(module => ({ default: module.MealLoggerPage })));
const ProgressPage = lazy(() => import('@/features/progress/pages/ProgressPage').then(module => ({ default: module.ProgressPage })));
const WeeklyReportPage = lazy(() => import('@/features/reports/pages/WeeklyReportPage').then(module => ({ default: module.WeeklyReportPage })));
const PricingPage = lazy(() => import('@/features/pricing/pages/PricingPage').then(module => ({ default: module.PricingPage })));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const CalorieDetailPage = lazy(() => import('@/features/nutrition/pages/CalorieDetailPage').then(module => ({ default: module.CalorieDetailPage })));
const ProteinDetailPage = lazy(() => import('@/features/nutrition/pages/ProteinDetailPage').then(module => ({ default: module.ProteinDetailPage })));
const AwardsPage = lazy(() => import('@/features/awards/pages/AwardsPage').then(module => ({ default: module.AwardsPage })));
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage').then(module => ({ default: module.AuthPage })));
const OnboardingPage = lazy(() => import('@/features/onboarding/pages/OnboardingPage').then(module => ({ default: module.OnboardingPage })));
const SciencePage = lazy(() => import('@/features/onboarding/pages/SciencePage').then(module => ({ default: module.SciencePage })));
const LandingPage = lazy(() => import('@/LandingPage').then(module => ({ default: module.LandingPage })));
const NotFoundPage = lazy(() => import('@/shared/components/NotFoundPage').then(module => ({ default: module.NotFoundPage })));
const AwardsGallery = lazy(() => import('@/features/awards/dev/AwardsGallery').then(module => ({ default: module.AwardsGallery })));


const PrivacyPage = lazy(() => import('@/features/legal/pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('@/features/legal/pages/TermsPage').then(module => ({ default: module.TermsPage })));
const RefundPage = lazy(() => import('@/features/legal/pages/RefundPage').then(module => ({ default: module.RefundPage })));
import { PublicLayout } from './layouts/PublicLayout';
import { useAwardsSync } from '@/features/awards/hooks/useAwardsSync';
import { AwardCelebrationSheet } from '@/features/awards/components/AwardCelebrationSheet';
import { AppLoadingScreen } from '@/shared/components/AppLoadingScreen';

function RootLayout() {
  useAwardsSync();
  return (
    <>
      <AppLoadingScreen />
      <AnalyticsObserver />
      <RouteMetadata />
      <ScrollHandler />
      <ScrollRestoration />
      <AwardCelebrationSheet />
      <Outlet />
    </>
  );
}

const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/awards-gallery',
        element: <Suspense fallback={<ScreenSkeleton />}><AwardsGallery /></Suspense>,
      },
    ]
  : [];

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
            element: <Suspense fallback={<PageSkeleton route="landing" />}><LandingPage /></Suspense>,
            handle: { title: 'LeanIQA' }
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
                <Suspense fallback={<PageSkeleton route="login" />}>
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
              { path: '/onboarding', element: <Suspense fallback={<PageSkeleton route="onboarding" />}><OnboardingPage /></Suspense>, handle: { title: 'Welcome', description: 'Get started with LeanIQA.' } },
              { path: '/science', element: <Suspense fallback={<PageSkeleton route="science" />}><SciencePage /></Suspense>, handle: { title: 'Why these numbers', description: 'Research behind your plan.' } },
              { path: '/dashboard', element: <Suspense fallback={<PageSkeleton route="dashboard" />}><DashboardPage /></Suspense>, handle: { title: 'Dashboard', description: 'Your daily nutrition and progress overview.' } },
              { path: '/meals', element: <Suspense fallback={<PageSkeleton route="meals" />}><MealLoggerPage /></Suspense>, handle: { title: 'Log Meal', description: 'Log your meals and track your macros.' } },
              { path: '/progress', element: <Suspense fallback={<PageSkeleton route="progress" />}><ProgressPage /></Suspense>, handle: { title: 'Progress', description: 'Track your long-term body transformation.' } },
              { path: '/reports', element: <Suspense fallback={<PageSkeleton route="reports" />}><WeeklyReportPage /></Suspense>, handle: { title: 'Reports', description: 'Weekly compliance and activity report.' } },
              { path: '/profile', element: <Suspense fallback={<PageSkeleton route="profile" />}><ProfilePage /></Suspense>, handle: { title: 'Profile', description: 'Manage your LeanIQA profile.' } },
              { path: '/pricing', element: <Suspense fallback={<PageSkeleton route="pricing" />}><PricingPage /></Suspense>, handle: { title: 'Pricing', description: 'Choose a subscription plan.' } },
              { path: '/awards', element: <Suspense fallback={<PageSkeleton route="awards" />}><AwardsPage /></Suspense>, handle: { title: 'Awards', description: 'View your earned achievements.' } },
              { path: '/calorie', element: <Suspense fallback={<PageSkeleton route="calorie" />}><CalorieDetailPage /></Suspense>, handle: { title: 'Calorie Detail', description: 'Detailed breakdown of your calorie intake.' } },
              { path: '/protein', element: <Suspense fallback={<PageSkeleton route="protein" />}><ProteinDetailPage /></Suspense>, handle: { title: 'Protein Detail', description: 'Detailed breakdown of your protein intake.' } }
            ]
          }
        ]
      },

      {
        element: <PublicLayout />,
        children: [
          { path: '/privacy', element: <Suspense fallback={<PageSkeleton route="legal" />}><PrivacyPage /></Suspense>, handle: { title: 'Privacy Policy' } },
          { path: '/terms', element: <Suspense fallback={<PageSkeleton route="legal" />}><TermsPage /></Suspense>, handle: { title: 'Terms of Service' } },
          { path: '/refund', element: <Suspense fallback={<PageSkeleton route="legal" />}><RefundPage /></Suspense>, handle: { title: 'Refund Policy' } }
        ]
      },
      {
        path: '/about',
        element: (
          <Suspense fallback={<PageSkeleton route="landing" />}>
            <LandingPage />
          </Suspense>
        ),
        handle: { title: 'About LeanIQA' },
      },
      ...devRoutes,
      {
        path: '/redirect',
        element: <RootRedirect />
      },
      {
        path: '*',
        element: <Suspense fallback={<PageSkeleton route="notFound" />}><NotFoundPage /></Suspense>,
        handle: { title: 'Page Not Found', description: 'The page you are looking for does not exist.' }
      }
    ]
  }
];
