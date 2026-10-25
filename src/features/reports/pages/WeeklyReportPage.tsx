import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trophy } from 'lucide-react';

import { weeklyReportService } from '../services/weeklyReportService';
import { useLiveWeekReport } from '../hooks/useLiveWeekReport';
import { useTrendData } from '../hooks/useTrendData';
import { TrendChart } from '../components/TrendChart';
import { WeeklyConsistencyCard } from '../components/WeeklyConsistencyCard';
import { WeekSelector } from '../components/WeekSelector';
import { DayTimeline } from '../components/DayTimeline';
import { DayDetailPanel } from '../components/DayDetailPanel';
import { getWeekSelectorState, shouldShowGraceHint } from '../utils/weekNavigation';
import { getWeekStart, getWeekEnd, computeWeekStatus } from '@/shared/utils/weekKey';
import { getKolkataDateString } from '@/shared/utils/timezone';
import { WeeklyReportSkeleton } from '@/shared/components/Skeletons';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { analytics } from '@/shared/utils/analytics';

export function WeeklyReportPage() {
  const navigate = useNavigate();
  const todayIso = getKolkataDateString();
  const currentWeekStart = getWeekStart(todayIso);
  const isOnline = useNetworkConnectivity();

  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [trendView, setTrendView] = useState<'7d' | '30d'>('7d');

  const { data: reportsList = [] } = useQuery({
    queryKey: ['weeklyReports', 'list'],
    queryFn: () => weeklyReportService.listWeeksWithReports(),
  });

  const earliestWeekStart =
    reportsList.length > 0
      ? reportsList[reportsList.length - 1].week_start
      : currentWeekStart;

  const nav = getWeekSelectorState(
    selectedWeekStart,
    currentWeekStart,
    earliestWeekStart,
  );

  const isCurrentWeek = selectedWeekStart === currentWeekStart;

  const { data: persistedReport, isLoading: persistedLoading } = useQuery({
    queryKey: ['weeklyReport', selectedWeekStart],
    queryFn: () => weeklyReportService.getWeek(selectedWeekStart),
    enabled: !isCurrentWeek,
  });

  const { data: liveReport, isLoading: liveLoading } = useLiveWeekReport(
    selectedWeekStart,
    isCurrentWeek,
  );

  const report = isCurrentWeek ? liveReport ?? persistedReport ?? null : persistedReport ?? null;
  const isLoading = isCurrentWeek ? liveLoading : persistedLoading;

  const { data: previousWeek = null } = useQuery({
    queryKey: ['weeklyReport', 'previous', selectedWeekStart],
    queryFn: () => weeklyReportService.getPreviousWeekWithMeals(selectedWeekStart),
  });

  const weekEnd = getWeekEnd(selectedWeekStart);
  const status = computeWeekStatus(weekEnd, todayIso);
  const showGrace = status === 'final' && shouldShowGraceHint(weekEnd, todayIso);

  // Trend data for 7/30-day charts
  const isTrendEnabled = isCurrentWeek || report != null;
  const trend7 = useTrendData({ days: 7, enabled: isTrendEnabled });
  const trend30 = useTrendData({ days: 30, enabled: isTrendEnabled });

  // Helper to format week date for display
  const formatWeekLabel = (weekStart: string) => {
    const [y, m, d] = weekStart.split('-').map(Number);
    const MONTH_NAMES = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const endDate = new Date(Date.UTC(y, m - 1, d + 6));
    return `${MONTH_NAMES[m - 1]} ${d} – ${MONTH_NAMES[endDate.getUTCMonth()]} ${endDate.getUTCDate()}, ${y}`;
  };

  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-4 md:px-8">
      {/* Header */}
      <header className="relative mb-8 md:mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <img
            src="/logo.png"
            alt="LeanIQ"
            className="w-8 h-8 md:w-10 md:h-10"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-xl md:text-2xl font-bold text-white hidden sm:block">LeanIQ</span>
        </div>

        {/* Center: LIVE REPORT badge (absolutely centered on desktop) */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 hidden md:block">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-widest text-[#D4FF00]">
            LIVE REPORT
          </span>
        </div>

        {/* Right: Trophy + Avatar */}
        <div className="flex items-center gap-3 w-full md:w-auto md:justify-end">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white transition-colors hover:bg-white/10"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-[#D4FF00]" />
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
              OM
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-only centered badge */}
      <div className="md:hidden mb-6 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-widest text-[#D4FF00]">
          LIVE REPORT
        </span>
      </div>

      {/* Week Selector */}
      <WeekSelector
        weekStart={selectedWeekStart}
        status={status}
        showGraceHint={showGrace}
        canGoPrev={nav.canGoPrev}
        canGoNext={nav.canGoNext}
        onPrev={() => {
          if (nav.prevWeekStart) {
            setSelectedWeekStart(nav.prevWeekStart);
            analytics.trackEvent('Weekly Report Week Changed', { direction: 'prev' });
          }
        }}
        onNext={() => {
          if (nav.nextWeekStart) {
            setSelectedWeekStart(nav.nextWeekStart);
            analytics.trackEvent('Weekly Report Week Changed', { direction: 'next' });
          }
        }}
      />

      <div className="mt-8 md:mt-12 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {!isOnline && !report ? (
            <motion.div
              key="offline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center"
            >
              <p className="text-zinc-400">
                You are offline. Connect to the internet to load this report.
              </p>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <WeeklyReportSkeleton />
            </motion.div>
          ) : report ? (
            <motion.div
              key={selectedWeekStart}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Week Label */}
              <div className="mb-8 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-400">
                  {formatWeekLabel(selectedWeekStart)}
                </span>
              </div>

              {/* Weekly Consistency Card */}
              <WeeklyConsistencyCard
                report={{
                  target_calories: report.target_calories,
                  target_protein_g: report.target_protein_g,
                  day_summaries: report.day_summaries,
                  targets: {
                    calories: report.target_calories,
                    protein: report.target_protein_g,
                  },
                }}
              />

              {/* Calories Trend Chart Card */}
              <div className="mt-8">
                <TrendChart
                  points={trendView === '7d' ? trend7.data?.points ?? [] : trend30.data?.points ?? []}
                  targetCalories={trendView === '7d' ? trend7.data?.targetCalories ?? 2000 : trend30.data?.targetCalories ?? 2000}
                  targetProteinG={trendView === '7d' ? trend7.data?.targetProteinG ?? 150 : trend30.data?.targetProteinG ?? 150}
                  trendView={trendView}
                  onTrendViewChange={setTrendView}
                />
              </div>

              {/* Action Items */}
              {(() => {
                const actionItems = weeklyReportService.generateActionItems({
                  daySummaries: report.day_summaries,
                  targets: { calories: report.target_calories, protein: report.target_protein_g },
                  streaks: {
                    calorie: { current: 0, longest: 0 },
                    protein: { current: 0, longest: 0 },
                  },
                });
                if (actionItems.length === 0) return null;
                return (
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-4">This Week</h3>
                    <div className="space-y-3">
                      {actionItems.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.3 }}
                          className="rounded-[16px] border border-white/5 bg-white/[0.03] p-4 md:p-5"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#D4FF00]" />
                            <span className="text-base leading-relaxed text-white/90">{item}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Day Timeline */}
              <DayTimeline
                key={selectedWeekStart}
                days={report.day_summaries}
                selectedDate={selectedDayDate}
                onSelectDate={setSelectedDayDate}
              />

              {/* Day Detail Panel */}
              <AnimatePresence>
                {selectedDayDate && (
                  <DayDetailPanel
                    report={report}
                    selectedDate={selectedDayDate}
                    onClose={() => setSelectedDayDate(null)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center"
            >
              <p className="text-zinc-400">
                No meals logged this week.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function formatWeekLabel(weekStart: string) {
  const [y, m, d] = weekStart.split('-').map(Number);
  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const endDate = new Date(Date.UTC(y, m - 1, d + 6));
  return `${MONTH_NAMES[m - 1]} ${d} – ${MONTH_NAMES[endDate.getUTCMonth()]} ${endDate.getUTCDate()}, ${y}`;
}