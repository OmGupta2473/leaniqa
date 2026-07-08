import { useReportStore } from "../store/reportStore";
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';
import { mealService } from '@/features/nutrition/services/mealService';
import { reportService } from '../services/reportService';
import { complianceService } from '../services/complianceService';
import { calculateCurrentDailyStreak, calculateEarnedAwards } from '@/shared/utils/streaks';
import { ProgressRing } from '../components/ProgressRing';
import { MicroRing } from '../components/MicroRing';
import { MealDistributionChart } from '../components/MealDistributionChart';
import { ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { springTap } from '../components/motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

import { DailyActivityData, ActivityView } from '@/shared/types/activity';

function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const NEON_PINK = '#FF2D55';
const ELECTRIC_LIME = '#D4FF00';
const ELECTRIC_BLUE = '#378ADD';

export function WeeklyReportPage() {
  

  const view = useReportStore(s => s.activityView) as ActivityView;
  const setView = useReportStore(s => s.setActivityView);
  const calendarMonthIso = useReportStore(s => s.activityCalendarMonth);
  const calendarMonth = new Date(calendarMonthIso);
  const setCalendarMonth = (d: Date | ((prev: Date) => Date)) => { const current = new Date(useReportStore.getState().activityCalendarMonth); const next = typeof d === "function" ? d(current) : d; useReportStore.getState().setActivityCalendarMonth(next.toISOString()); };

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals = [] } = useQuery({ queryKey: ['meals', 'month'], queryFn: () => mealService.getMeals({ days: 35, limit: 2000 }) });
  const { data: dailyMetrics = [] } = useQuery({ queryKey: ['dailyMetrics'], queryFn: () => reportService.getDailyMetrics() });
  const currentStreak = calculateCurrentDailyStreak(dailyMetrics);
  const earnedAwards = calculateEarnedAwards(dailyMetrics);

  const calorieGoal = profile?.maintenance_kcal && goal?.deficit_kcal !== undefined ? profile.maintenance_kcal - goal.deficit_kcal : 2000;
  const proteinGoal = profile?.protein_target || 150;

  const today = new Date();
  const todayStr = getLocalDateString(today);

  // Build today's full DailyActivityData including hourly breakdown
  const todayActivity: DailyActivityData = useMemo(() => {
    const todaysMeals = meals.filter(m => m.meal_time.startsWith(todayStr));
    const hourlyCalories = Array(24).fill(0);
    todaysMeals.forEach(m => {
      const hour = new Date(m.meal_time).getHours();
      hourlyCalories[hour] += m.calories;
    });
    const metric = dailyMetrics.find(d => d.date === todayStr);
    return {
      date: todayStr,
      caloriesConsumed: todaysMeals.reduce((a, m) => a + m.calories, 0),
      calorieTarget: calorieGoal,
      proteinConsumed: todaysMeals.reduce((a, m) => a + m.protein, 0),
      proteinTarget: proteinGoal,
      fatConsumed: todaysMeals.reduce((a, m) => a + m.fat, 0),
      fatTarget: profile?.maintenance_kcal ? Math.round((calorieGoal * 0.27) / 9) : 60,
      carbsConsumed: todaysMeals.reduce((a, m) => a + m.carbs, 0),
      carbsTarget: profile?.maintenance_kcal ? Math.round((calorieGoal * 0.45) / 4) : 220,
      complianceScore: metric?.score ?? 0,
      hourlyCalories,
    };
  }, [meals, dailyMetrics, todayStr, calorieGoal, proteinGoal, profile]);

  // Build last 7 days of DailyActivityData for the strip
  const last7Days: DailyActivityData[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = getLocalDateString(d);
      const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
      const metric = dailyMetrics.find(m => m.date === dateStr);
      return {
        date: dateStr,
        caloriesConsumed: dayMeals.reduce((a, m) => a + m.calories, 0),
        calorieTarget: metric?.target_calories ?? calorieGoal,
        proteinConsumed: dayMeals.reduce((a, m) => a + m.protein, 0),
        proteinTarget: metric?.target_protein ?? proteinGoal,
        fatConsumed: dayMeals.reduce((a, m) => a + m.fat, 0),
        fatTarget: 60,
        carbsConsumed: dayMeals.reduce((a, m) => a + m.carbs, 0),
        carbsTarget: 220,
        complianceScore: metric?.score ?? 0,
      };
    });
  }, [meals, dailyMetrics, calorieGoal, proteinGoal]);

  // Build full month grid for calendar view
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (DailyActivityData | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = getLocalDateString(dateObj);
      const dayMeals = meals.filter(m => m.meal_time.startsWith(dateStr));
      const metric = dailyMetrics.find(m => m.date === dateStr);
      cells.push({
        date: dateStr,
        caloriesConsumed: dayMeals.reduce((a, m) => a + m.calories, 0),
        calorieTarget: metric?.target_calories ?? calorieGoal,
        proteinConsumed: dayMeals.reduce((a, m) => a + m.protein, 0),
        proteinTarget: metric?.target_protein ?? proteinGoal,
        fatConsumed: 0,
        fatTarget: 60,
        carbsConsumed: 0,
        carbsTarget: 220,
        complianceScore: metric?.score ?? 0,
      });
    }
    return cells;
  }, [calendarMonth, meals, dailyMetrics, calorieGoal, proteinGoal]);

  const recentBadges = earnedAwards.filter(a => a.earned).slice(-6);

  return (
    <div style={{ minHeight: '100dvh', background: 'radial-gradient(circle at top, #111115 0%, #000000 100%)', color: 'white' }} className="screen-enter">
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px calc(env(safe-area-inset-bottom) + 40px)' }}>

        {/* Header with view switcher */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity</div>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, letterSpacing: '-0.4px' }}>
              {view === 'dashboard' ? 'Today' : view === 'detail' ? 'Last 7 Days' : calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2px', background: '#1C1C1E', borderRadius: '10px', padding: '3px', position: 'relative' }}>
            {(['dashboard', 'detail', 'calendar'] as ActivityView[]).map(v => (
              <motion.button
                key={v}
                onClick={() => setView(v)}
                whileTap={springTap}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: 'transparent',
                  color: view === v ? 'white' : 'rgba(235,235,245,0.5)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  position: 'relative',
                  zIndex: 1,
                  outline: 'none',
                }}
              >
                {v === 'dashboard' ? 'Day' : v === 'detail' ? 'Week' : 'Month'}
                {view === v && (
                  <motion.div
                    layoutId="activeTab"
                    transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                    style={{ position: 'absolute', inset: 0, background: NEON_PINK, borderRadius: '7px', zIndex: -1 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
        {/* ── DASHBOARD VIEW ── */}
        {view === 'dashboard' && (
          <motion.div key="dashboard" variants={containerVariants} initial="hidden" animate="show" exit="exit">
            {/* Ring summary card */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', marginBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 200, height: 200, marginBottom: '8px' }}>
                <ProgressRing current={todayActivity.caloriesConsumed} goal={todayActivity.calorieTarget} size={200} strokeWidth={16} color={NEON_PINK}>
                  <AnimatedNumber value={todayActivity.caloriesConsumed} style={{ fontSize: '32px', fontWeight: 800 }} />
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>/ {todayActivity.calorieTarget} kcal</div>
                </ProgressRing>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                {[
                  { label: 'Protein', current: todayActivity.proteinConsumed, goal: todayActivity.proteinTarget, color: ELECTRIC_LIME, unit: 'g' },
                  { label: 'Fat', current: todayActivity.fatConsumed, goal: todayActivity.fatTarget, color: ELECTRIC_BLUE, unit: 'g' },
                  { label: 'Carbs', current: todayActivity.carbsConsumed, goal: todayActivity.carbsTarget, color: '#FFD60A', unit: 'g' },
                ].map(m => (
                  <motion.div key={m.label} whileTap={springTap}>
                    <ProgressRing current={m.current} goal={m.goal} size={64} strokeWidth={7} color={m.color}>
                      <AnimatedNumber value={m.current} style={{ fontSize: '13px', fontWeight: 700 }} />
                    </ProgressRing>
                  </motion.div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                {['Protein', 'Fat', 'Carbs'].map(l => (
                  <div key={l} style={{ width: 64, textAlign: 'center', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{l}</div>
                ))}
              </div>
            </motion.div>

            {/* Meal Distribution card */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <MealDistributionChart color={NEON_PINK} />
            </motion.div>

            {/* Trends card */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <motion.div animate={{ opacity: [1, 0.7, 1], scale: [1, 0.95, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <Flame size={16} color={ELECTRIC_LIME} />
                </motion.div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Trends</div>
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'rgba(235,235,245,0.7)', lineHeight: 1.5 }}>
                {currentStreak > 0 ? <>You're on a <AnimatedNumber value={currentStreak} style={{ color: ELECTRIC_LIME, fontWeight: 700 }} />-day daily streak. </> : 'Log today to start a new streak. '}
              </div>
            </motion.div>

            {/* Awards row */}
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Trophy size={16} color={NEON_PINK} />
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Recent Awards</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {recentBadges.length === 0 ? (
                  <div style={{ gridColumn: 'span 6', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.4)', textAlign: 'center', padding: '12px 0' }}>No awards yet — keep your streak going</div>
                ) : recentBadges.map(a => (
                  <motion.div key={a.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1', borderRadius: '10px', border: `1.5px solid ${a.primaryColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: `${a.primaryColor}1A`, boxShadow: `0 4px 12px ${a.primaryColor}22` }}>
                    {a.symbol}
                    <motion.div 
                      initial={{ x: '-100%', opacity: 0 }} 
                      whileHover={{ x: '100%', opacity: 0.5 }} 
                      transition={{ duration: 0.6, ease: "easeInOut" }} 
                      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', background: `linear-gradient(90deg, transparent, ${a.primaryColor}88, transparent)`, transform: 'skewX(-20deg)' }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── DETAIL VIEW (7-day strip) ── */}
        {view === 'detail' && (
          <motion.div key="detail" variants={containerVariants} initial="hidden" animate="show" exit="exit">
            <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {last7Days.map(day => (
                  <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={36} strokeWidth={4} color={NEON_PINK} />
                    <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {last7Days.map(day => (
              <motion.div key={day.date} variants={itemVariants} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={44} strokeWidth={5} color={NEON_PINK} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.5)' }}>{day.caloriesConsumed} kcal · {day.proteinConsumed}g protein</div>
                </div>
                <motion.div animate={{ color: day.complianceScore >= 70 ? ELECTRIC_LIME : 'rgba(235,235,245,0.5)' }} style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{day.complianceScore}</motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && (
          <motion.div key="calendar" variants={containerVariants} initial="hidden" animate="show" exit="exit">
          <motion.div variants={itemVariants} style={{ background: 'linear-gradient(180deg, #222224 0%, #18181A 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <motion.button whileTap={springTap} onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                <ChevronLeft size={20} />
              </motion.button>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              <motion.button whileTap={springTap} onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                <ChevronRight size={20} />
              </motion.button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.4)' }}>{d}</div>
              ))}
            </div>
            <motion.div 
              key={calendarMonthIso}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {calendarDays.map((day, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.01 }} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {day ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {day.date === todayStr && (
                        <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: ELECTRIC_LIME, filter: 'blur(4px)', opacity: 0.4 }} />
                      )}
                      <MicroRing current={day.caloriesConsumed} goal={day.calorieTarget} size={32} strokeWidth={3} color={day.date === todayStr ? ELECTRIC_LIME : NEON_PINK} />
                      <div style={{ position: 'absolute', fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>{new Date(day.date).getDate()}</div>
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
