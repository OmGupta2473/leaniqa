import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

import { weeklyReportService } from '../services/weeklyReportService';
import { useLiveWeekReport } from '../hooks/useLiveWeekReport';
import { WeekSelector } from '../components/WeekSelector';
import { HeroCard } from '../components/HeroCard';
import { ComparisonStrip } from '../components/ComparisonStrip';
import { CoachSummaryCard } from '../components/CoachSummaryCard';
import { DayTimeline } from '../components/DayTimeline';
import { DayDetailPanel } from '../components/DayDetailPanel';
import { InsightsSection } from '../components/InsightsSection';
import { FocusNextWeek } from '../components/FocusNextWeek';
import { MacroBalance } from '../components/MacroBalance';
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

  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to dashboard"
          className="w-11 h-11 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-white transition-colors hover:bg-[rgba(255,255,255,0.08)]"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[22px] font-semibold text-white tracking-tight">
          Weekly Report
        </h1>
        <div className="w-11" />
      </div>

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

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {!isOnline && !report ? (
            <motion.div
              key="offline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-[24px] border border-dashed border-[rgba(255,255,255,0.08)] p-8 text-center"
            >
              <p className="text-[14px] text-zinc-500">
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
              <HeroCard report={report} />
              <DayTimeline
                key={selectedWeekStart}
                days={report.day_summaries}
                selectedDate={selectedDayDate}
                onSelectDate={setSelectedDayDate}
              />
              <AnimatePresence>
                {selectedDayDate && (
                  <DayDetailPanel
                    report={report}
                    selectedDate={selectedDayDate}
                    onClose={() => setSelectedDayDate(null)}
                  />
                )}
              </AnimatePresence>
              <ComparisonStrip current={report} previous={previousWeek} />
              <CoachSummaryCard report={report} />
              <InsightsSection report={report} />
              <FocusNextWeek report={report} />
              <MacroBalance report={report} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-[24px] border border-dashed border-[rgba(255,255,255,0.08)] p-8 text-center"
            >
              <p className="text-[14px] text-zinc-500">
                No meals logged this week.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}