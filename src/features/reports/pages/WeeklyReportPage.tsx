import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

import { weeklyReportService } from '../services/weeklyReportService';
import { useLiveWeekReport } from '../hooks/useLiveWeekReport';
import { useTrendData } from '../hooks/useTrendData';
import { TrendChart } from '../components/TrendChart';
import { WeekSelector } from '../components/WeekSelector';
import { HeroCard } from '../components/HeroCard';
import { ComparisonStrip } from '../components/ComparisonStrip';
import { CoachSummaryCard } from '../components/CoachSummaryCard';
import { BestDayCard } from '../components/BestDayCard';
import { PlanValueFooter } from '../components/PlanValueFooter';
import { DayTimeline } from '../components/DayTimeline';
import { DayDetailPanel } from '../components/DayDetailPanel';
import { InsightsSection } from '../components/InsightsSection';
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

  // Trend data for 7/30-day charts
  const isTrendEnabled = isCurrentWeek || report != null;
  const trend7 = useTrendData({ days: 7, enabled: isTrendEnabled });
  const trend30 = useTrendData({ days: 30, enabled: isTrendEnabled });
  const [trendView, setTrendView] = useState<'7d' | '30d'>('7d');

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
              {/* Trend Chart - 7/30 day */}
              <div className="mb-6">
                <TrendChart
                  points={trendView === '7d' ? trend7.data?.points ?? [] : trend30.data?.points ?? []}
                  targetCalories={trendView === '7d' ? trend7.data?.targetCalories ?? 2000 : trend30.data?.targetCalories ?? 2000}
                  targetProteinG={trendView === '7d' ? trend7.data?.targetProteinG ?? 150 : trend30.data?.targetProteinG ?? 150}
                />
                <div className="flex justify-center gap-2 mt-2">
                  <button
                    onClick={() => setTrendView('7d')}
                    className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${
                      trendView === '7d'
                        ? 'bg-[#D4FF00] text-[#0A0A0A]'
                        : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    7 Day
                  </button>
                  <button
                    onClick={() => setTrendView('30d')}
                    className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${
                      trendView === '30d'
                        ? 'bg-[#D4FF00] text-[#0A0A0A]'
                        : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    30 Day
                  </button>
                </div>
              </div>
              {/* Weekly Action Items */}
              {report && (() => {
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
                  <div className="mb-6">
                    <div className="text-[12px] font-semibold uppercase tracking-widest text-[rgba(235,235,245,0.5)] mb-3">This Week</div>
                    <div className="space-y-2">
                      {actionItems.map((item, i) => (
                        <div key={i} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full bg-[#D4FF00]" />
                            <span className="text-[13px] leading-relaxed text-[rgba(255,255,255,0.85)]">{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

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
              <BestDayCard report={report} />
              <InsightsSection report={report} />
              <MacroBalance report={report} />
              <PlanValueFooter />
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