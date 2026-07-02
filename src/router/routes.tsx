import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { PublicRoute } from './PublicRoute';
import { RootRedirect } from './RootRedirect';
import { LegacyApp } from '../LegacyApp';

export const routes: RouteObject[] = [
  // Future React Router architecture (Phase 2+)
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      { path: 'dashboard', element: <div>Dashboard (Coming Soon)</div> },
      { path: 'meal', element: <div>Meal Logger (Coming Soon)</div> },
      { path: 'progress', element: <div>Progress (Coming Soon)</div> },
      { path: 'week', element: <div>Weekly Report (Coming Soon)</div> },
      { path: 'pricing', element: <div>Pricing (Coming Soon)</div> },
      { path: 'profile', element: <div>Profile (Coming Soon)</div> },
      { path: 'transformation', element: <div>Transformation (Coming Soon)</div> },
      { path: 'calorie', element: <div>Calorie Detail (Coming Soon)</div> },
      { path: 'protein', element: <div>Protein Detail (Coming Soon)</div> },
      { path: 'awards', element: <div>Awards (Coming Soon)</div> },
    ]
  },
  {
    path: '/auth',
    element: <GuestRoute />,
    children: [
      { path: 'login', element: <div>Auth (Coming Soon)</div> }
    ]
  },
  {
    path: '/setup',
    element: <ProtectedRoute />,
    children: [
      { path: 'onboard', element: <div>Onboarding (Coming Soon)</div> },
      { path: 'goal', element: <div>Goal Setter (Coming Soon)</div> }
    ]
  },
  {
    path: '/public',
    element: <PublicRoute />,
    children: [
      { path: 'about', element: <div>About (Coming Soon)</div> }
    ]
  },
  {
    path: '/redirect',
    element: <RootRedirect />
  },
  
  // Phase 1: Keep existing navigation working by rendering LegacyApp at root
  // All URLs not matched above will fallback to LegacyApp
  {
    path: '*',
    element: <LegacyApp />
  }
];
