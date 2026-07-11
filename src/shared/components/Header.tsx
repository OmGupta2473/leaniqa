import { authService } from '@/features/auth/services/authService';
import { useAppStore } from '@/app/store';
import { reportService } from '@/features/reports/services/reportService';
import { calculateEarnedAwards } from '@/shared/utils/streaks';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { supabase } from '@/shared/utils/supabase';
import { useNetworkStatus } from '@/shared/utils/utils';
import { WifiOff, ChevronLeft } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHasCompletedOnboarding } from '@/shared/hooks/useHasCompletedOnboarding';
import { motion } from 'motion/react';

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

  const { profile, hasCompletedOnboarding } = useHasCompletedOnboarding();
  const todayStr = getLocalDateString();
  const hasNewAwards = earnedAwards.some(a => a.earned && a.earnedDate === todayStr);
  
  // Show back button on sub-pages
  const showBack = ['/awards', '/profile'].includes(location.pathname);

  return (
    <motion.div 
      initial={{ y: -8, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
      className="px-5 flex items-center justify-between shrink-0 z-10"
      style={{
        height: '52px',
        background: 'rgba(8,8,9,0.88)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)'
      }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center cursor-pointer border-none bg-transparent p-0 transition-colors duration-150 ease-in-out"
            style={{
              width: '28px',
              height: '28px',
              color: 'rgba(255,255,255,0.6)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        <div className="flex items-center gap-2">
          <div 
            className="flex items-center justify-center font-bold text-black"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: '#D4FF00',
              fontSize: '14px'
            }}
          >
            L
          </div>
          <span 
            className="font-semibold"
            style={{
              fontSize: '16px',
              letterSpacing: '-0.4px',
              color: 'rgba(255,255,255,0.92)'
            }}
          >
            LeanIQa
          </span>
        </div>

        {!isOnline && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] py-[2px] px-2 rounded-full flex items-center gap-1">
            <WifiOff size={10} /> Offline
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasCompletedOnboarding === false && (
          <button
            onClick={() => authService.logout()}
            className="text-[12px] cursor-pointer bg-transparent border-none transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FF4D1C'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          >
            Logout
          </button>
        )}
        <div 
          className="relative flex items-center justify-center"
          onClick={() => {
            if (hasCompletedOnboarding !== false) navigate('/awards');
          }}
          style={{ 
            opacity: hasCompletedOnboarding === false ? 0.5 : 1, 
            cursor: hasCompletedOnboarding === false ? 'not-allowed' : 'pointer',
            width: '32px',
            height: '32px'
          }}
          title="Awards Hall"
        >
          <i className="ti ti-trophy text-[18px] text-[#D4FF00]"></i>
          {hasNewAwards && (
            <div 
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                borderRadius: '99px',
                background: '#FF4D1C',
                border: '1px solid rgba(8,8,9,0.88)'
              }}
            />
          )}
        </div>
        <div 
          className="rounded-full flex items-center justify-center text-[12px] font-medium"
          onClick={() => {
            if (hasCompletedOnboarding !== false) navigate('/profile');
          }}
          style={{ 
            cursor: hasCompletedOnboarding === false ? 'not-allowed' : 'pointer',
            background: 'rgba(212,255,0,0.12)',
            color: '#D4FF00',
            width: '32px',
            height: '32px'
          }}
        >
          {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'ME'}
        </div>
      </div>
    </motion.div>
  );
}
