import { useAppStore } from '@/app/store';
import { reportService } from '@/features/reports';
import { calculateEarnedAwards } from '@/shared/utils/streaks';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile';
import { supabase } from '@/shared/utils/supabase';
import { useNetworkStatus } from '@/shared/utils/utils';
import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/login': 'Sign In',
  '/onboarding': 'Welcome to LeanIQA',
  '/goal': 'Set Your Body Goal',
  '/dashboard': 'Dashboard',
  '/meals': 'Nutrition Log',
  '/progress': 'Timeline Projection',
  '/activity': 'Activity',
  '/pricing': 'Plans & pricing'
};

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function Header() {
  
  const { data: metrics = [] } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });
  const earnedAwards = calculateEarnedAwards(metrics);

  const { isOnline } = useNetworkStatus();
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session as any);
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: !!session,
  });

  const todayStr = getLocalDateString();
  const hasNewAwards = earnedAwards.some(a => a.earned && a.earnedDate === todayStr);

  const title = TITLES[location.pathname] || 'LeanIQA';

  return (
    <div className="px-5 py-4 border-b-[0.5px] border-border-tertiary flex items-center justify-between shrink-0 bg-background-primary z-10">
      <div className="text-[15px] font-medium text-text-primary flex items-center gap-2">
        {title}
        {!isOnline && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] py-[2px] px-2 rounded-full flex items-center gap-1">
            <WifiOff size={10} /> Offline
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div 
          className="awards-nav-btn"
          onClick={() => navigate('/awards')}
          title="Awards Hall"
        >
          <i className="ti ti-trophy text-[18px] text-[#D4FF00]"></i>
          {hasNewAwards && <div className="notif-dot"></div>}
        </div>
        <div 
          className="w-8 h-8 rounded-full bg-purple-bg flex items-center justify-center text-[12px] font-medium text-purple cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'ME'}
        </div>
      </div>
    </div>
  );
}
