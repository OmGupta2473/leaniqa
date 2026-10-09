import { useEffect, useState } from 'react';
import {
  DashboardSkeleton,
  MealLoggerSkeleton,
  ProgressSkeleton,
  WeeklyReportSkeleton,
  ProfileSkeleton,
  AwardsSkeleton,
  NutritionDetailSkeleton,
} from './Skeletons';
import { ScreenSkeleton } from './ScreenSkeleton';

type RouteKey =
  | 'dashboard' | 'meals' | 'progress' | 'reports' | 'profile'
  | 'awards' | 'calorie' | 'protein' | 'pricing' | 'science'
  | 'onboarding' | 'login' | 'landing' | 'legal' | 'notFound';

const SKELETON_MAP: Record<RouteKey, React.ComponentType> = {
  dashboard: DashboardSkeleton,
  meals: MealLoggerSkeleton,
  progress: ProgressSkeleton,
  reports: WeeklyReportSkeleton,
  profile: ProfileSkeleton,
  awards: AwardsSkeleton,
  calorie: NutritionDetailSkeleton,
  protein: NutritionDetailSkeleton,
  pricing: ScreenSkeleton,
  science: ScreenSkeleton,
  onboarding: ScreenSkeleton,
  login: ScreenSkeleton,
  landing: ScreenSkeleton,
  legal: ScreenSkeleton,
  notFound: ScreenSkeleton,
};

// Delay before showing any skeleton — avoids the "flash of loading" for fast
// transitions. 200ms is Apple's perceptual threshold: below it, users can't tell
// whether a frame was delayed.
const SHOW_DELAY_MS = 200;

// After this long, add a small "Still loading…" hint above the skeleton. Only
// applies when the skeleton is already showing.
const SLOW_HINT_MS = 3000;

interface PageSkeletonProps {
  route: RouteKey;
}

export function PageSkeleton({ route }: PageSkeletonProps) {
  const [visible, setVisible] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setSlow(true), SLOW_HINT_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  const Skeleton = SKELETON_MAP[route];

  return (
    <>
      {slow && (
        <div
          className="text-center text-[12px] text-zinc-500 py-3 motion-safe:animate-pulse"
          role="status"
          aria-live="polite"
        >
          Still loading…
        </div>
      )}
      <Skeleton />
    </>
  );
}
