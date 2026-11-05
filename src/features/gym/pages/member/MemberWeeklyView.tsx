import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Calendar,
  Activity,
  Target,
} from 'lucide-react';
import { motion } from 'motion/react';
import { gymOwnerService, type GymMember, type MemberWeeklyReportRow } from '../../services/gymOwnerService';
import {
  getKolkataDateString,
} from '@/shared/utils/timezone';
import { getWeekStart, getWeekEnd, shiftWeek } from '@/shared/utils/weekKey';
import { haptics } from '@/shared/utils/haptics';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { cn } from '@/shared/utils/utils';
import '../../styles/gymOwner.css';

interface MemberWeeklyViewProps {
  gymId: string;
  member: GymMember;
}

export function MemberWeeklyView({ gymId, member }: MemberWeeklyViewProps) {
  const isOnline = useNetworkConnectivity();
  const today = getKolkataDateString();
  const currentWeekStart = getWeekStart(today);
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);

  const weekEnd = getWeekEnd(selectedWeekStart);

  const query = useQuery({
    queryKey: ['gymMemberReports', gymId, member.userId, selectedWeekStart],
    queryFn: () =>
      gymOwnerService.getMemberWeeklyReports(
        gymId,
        member.userId,
        selectedWeekStart,
        weekEnd,
      ),
    staleTime: 0,
  });

  const result = query.data;
  const rows: MemberWeeklyReportRow[] = result?.ok ? result.data ?? [] : [];
  const report = rows[0];

  const isCurrentWeek = selectedWeekStart === currentWeekStart;

  const handlePrevWeek = () => {
    haptics.tap();
    setSelectedWeekStart(shiftWeek(selectedWeekStart, -1));
  };

  const handleNextWeek = () => {
    if (isCurrentWeek) return;
    haptics.tap();
    setSelectedWeekStart(shiftWeek(selectedWeekStart, 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header: Weekly Report + Week Nav */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h2 className="text-[28px] font-semibold text-white tracking-tight">Weekly Report</h2>
          <div className="text-[14px] font-medium text-[rgba(235,235,245,0.5)] mt-0.5">
            {getWeekLabel(selectedWeekStart)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer active:scale-95 transition-all duration-200"
            aria-label="Previous Week"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="text-[15px] font-semibold text-white min-w-[85px] text-center tracking-tight">
            {isCurrentWeek ? 'This Week' : 'Past Week'}
          </span>
          <button
            type="button"
            onClick={handleNextWeek}
            disabled={isCurrentWeek}
            className={cn(
              'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200',
              isCurrentWeek
                ? 'opacity-30 cursor-not-allowed'
                : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer active:scale-95',
            )}
            aria-label="Next Week"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.error ? (
        <ErrorBlock
          title="Couldn't load reports"
          body={isOnline ? 'Try again in a moment.' : 'You are offline.'}
          onRetry={() => query.refetch()}
        />
      ) : result && !result.ok ? (
        result.errorCode === 'member_not_shareable' ? (
          <RevokedBlock memberName={member.name} />
        ) : (
          <ErrorBlock
            title="Reports unavailable"
            body={result.error ?? 'Could not load reports.'}
            onRetry={() => query.refetch()}
          />
        )
      ) : !report ? (
        <div className="gym-glass">
          <div className="gym-empty">
            <div className="gym-empty-icon">
              <Calendar size={18} />
            </div>
            <div className="gym-empty-title">No weekly report</div>
            <div className="gym-empty-body">
              Weekly reports are generated after the member logs meals for at least three days in a week.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Score Ring */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-6 shadow-sm backdrop-blur-xl flex flex-col sm:flex-row items-center gap-6"
          >
            <ScoreRing score={report.weeklyScore} />
            
            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="text-[12px] font-semibold uppercase tracking-widest text-[rgba(235,235,245,0.5)] mb-2">
                Weekly Score
              </div>
              <div className="text-[15px] text-[rgba(255,255,255,0.8)] leading-snug mb-4">
                {report.weeklyScore >= 80
                  ? 'Excellent consistency this week.'
                  : report.weeklyScore >= 60
                  ? 'Solid effort, some room to tighten up.'
                  : 'A tough week, but every logged day counts.'}
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] px-3 py-1 text-[12px] font-medium text-white">
                  {report.daysWithMeals} / 7 days logged
                </span>
                <span className="rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] px-3 py-1 text-[12px] font-medium text-white">
                  {report.confidence} confidence
                </span>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <StatCard
              label="Avg Calories"
              value={Math.round(report.avgCalories).toLocaleString()}
              unit="kcal"
              icon={<Activity size={16} className="text-[#FF4D1C]" />}
            />
            <StatCard
              label="Avg Protein"
              value={report.avgProteinG.toFixed(1)}
              unit="g"
              icon={<Target size={16} className="text-[#378ADD]" />}
            />
          </motion.div>

          {/* Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="rounded-[24px] border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.01)] p-8 flex flex-col items-center text-center mt-2"
          >
            <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
              <Calendar size={24} className="text-[rgba(255,255,255,0.3)]" />
            </div>
            <div className="text-[16px] font-semibold text-white mb-1">
              Full weekly view coming soon
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.5)] max-w-[280px]">
              Trend charts, day timeline, comparison strips, and coach summaries will be available in a future update.
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-[100px] h-[100px] shrink-0 flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#D4FF00"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[28px] font-bold text-white tracking-tighter leading-none">
          {score}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-4 flex flex-col justify-between h-[90px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(235,235,245,0.5)]">
          {label}
        </span>
        {icon}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[22px] font-bold text-white tracking-tight tabular-nums leading-none">
          {value}
        </span>
        <span className="text-[12px] font-medium text-[rgba(255,255,255,0.5)]">{unit}</span>
      </div>
    </div>
  );
}

function ErrorBlock({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry: () => void;
}) {
  return (
    <div className="gym-glass">
      <div className="gym-error">
        <div className="gym-error-icon">
          <AlertTriangle size={18} />
        </div>
        <div className="gym-empty-title">{title}</div>
        <div className="gym-empty-body">{body}</div>
        <button type="button" onClick={onRetry} className="gym-secondary-btn mt-1">
          Try again
        </button>
      </div>
    </div>
  );
}

function RevokedBlock({ memberName }: { memberName: string | null }) {
  return (
    <div className="gym-glass">
      <div className="gym-locked">
        <div className="gym-locked-icon">
          <Lock size={20} />
        </div>
        <div className="gym-empty-title">Sharing was turned off</div>
        <div className="gym-empty-body">
          {memberName ?? 'This member'} has revoked gym sharing. Reports are no
          longer visible. If they re-enable sharing from their Profile, data
          will appear here again.
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="gym-glass" aria-busy="true">
      <div className="gym-row" aria-hidden="true">
        <div className="gym-row-main">
          <div className="gym-skeleton" style={{ height: 24, width: '40%' }} />
          <div className="gym-skeleton mt-2" style={{ height: 16, width: '70%' }} />
        </div>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="gym-row" aria-hidden="true">
          <div className="gym-row-main">
            <div className="gym-skeleton" style={{ height: 16, width: '60%' }} />
            <div className="gym-skeleton mt-1" style={{ height: 12, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getWeekLabel(weekStart: string): string {
  const startParts = weekStart.split('-').map(Number);
  const endDate = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  
  const startMonth = endDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  
  const startStr = `${startMonth} ${startParts[2]}`;
  const endStr = `${endMonth} ${endDate.getUTCDate()}`;
  const year = endDate.getUTCFullYear();
  
  return `${startStr} – ${endStr}, ${year}`;
}