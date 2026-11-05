import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, MotionConfig, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ChevronLeft,
  ClipboardList,
  Lock,
  Utensils,
  WifiOff,
} from 'lucide-react';
import { gymOwnerService, type GymMember } from '../services/gymOwnerService';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { haptics } from '@/shared/utils/haptics';
import { cn } from '@/shared/utils/utils';
import {
  springTap,
  transitionFadeSlide,
} from '@/features/reports/components/motion';
import '../styles/gymOwner.css';


type Tab = 'meals' | 'reports';


export function GymOwnerMemberDetailPage() {
  const navigate = useNavigate();
  const { gymId, memberId } = useParams<{ gymId: string; memberId: string }>();
  const isOnline = useNetworkConnectivity();
  const [tab, setTab] = useState<Tab>('meals');


  const membersQuery = useQuery({
    queryKey: ['gymMembers', gymId],
    queryFn: () => gymOwnerService.listGymMembers(gymId!),
    enabled: !!gymId,
  });


  const member: GymMember | null = useMemo(() => {
    if (!membersQuery.data || !memberId) return null;
    return membersQuery.data.find((m) => m.userId === memberId) ?? null;
  }, [membersQuery.data, memberId]);


  // Last 30 days for meals, last 12 weeks for reports. Fixed windows for
  // the pilot — a range picker is a follow-up.
  const { sinceIso, untilIso, sinceDate, untilDate } = useMemo(() => {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 86400000);
    const since84 = new Date(now.getTime() - 84 * 86400000);
    return {
      sinceIso: since30.toISOString(),
      untilIso: now.toISOString(),
      sinceDate: toIsoDate(since84),
      untilDate: toIsoDate(now),
    };
  }, []);


  const hasAccess = member?.hasMealAccess === true;


  const mealsQuery = useQuery({
    queryKey: ['gymMemberMeals', gymId, memberId],
    queryFn: () =>
      gymOwnerService.getMemberActivity(gymId!, memberId!, sinceIso, untilIso),
    enabled: !!gymId && !!memberId && hasAccess && tab === 'meals',
  });


  const reportsQuery = useQuery({
    queryKey: ['gymMemberReports', gymId, memberId],
    queryFn: () =>
      gymOwnerService.getMemberWeeklyReports(gymId!, memberId!, sinceDate, untilDate),
    enabled: !!gymId && !!memberId && hasAccess && tab === 'reports',
  });


  // ── Loading ─────────────────────────────────────────────────────────
  if (!gymId || !memberId) {
    return (
      <PageShell onBack={() => navigate('/gym')}>
        <ErrorBlock
          title="Invalid link"
          body="This member link is missing an ID."
          onRetry={() => navigate('/gym')}
          retryLabel="Back to gym"
        />
      </PageShell>
    );
  }


  if (membersQuery.isLoading) {
    return <DetailSkeleton onBack={() => navigate('/gym')} />;
  }


  if (membersQuery.error) {
    return (
      <PageShell onBack={() => navigate('/gym')}>
        <ErrorBlock
          title="Couldn't load member"
          body={isOnline ? 'Try again in a moment.' : 'You are offline.'}
          onRetry={() => membersQuery.refetch()}
        />
      </PageShell>
    );
  }


  if (!member) {
    return (
      <PageShell onBack={() => navigate('/gym')}>
        <ErrorBlock
          title="Member not found"
          body="This member is not part of your gym."
          onRetry={() => navigate('/gym')}
          retryLabel="Back to gym"
        />
      </PageShell>
    );
  }


  const displayName = member.name ?? member.userId.slice(0, 8);


  return (
    <MotionConfig reducedMotion="user">
      <PageShell onBack={() => navigate('/gym')}>
        <div>
          <h1 className="gym-title">{displayName}</h1>
          <div className="gym-row-pills mt-2">
            <span className={cn('gym-pill', member.isActive ? 'gym-pill-active' : 'gym-pill-ended')}>
              {member.isActive ? 'Premium' : 'Ended'}
            </span>
            {member.shareMealData && (
              <span className="gym-pill gym-pill-share">Sharing enabled</span>
            )}
            {!member.hasMealAccess && (
              <span className="gym-pill gym-pill-ended">
                <Lock size={10} strokeWidth={2.5} /> No data access
              </span>
            )}
          </div>
          <p className="gym-caption mt-2">
            {member.isActive
              ? `Premium until ${formatDate(member.premiumUntil)}`
              : `Access ended ${formatDate(member.premiumUntil)}`}
            {' · '}
            Joined {formatDate(member.redeemedAt)}
          </p>
        </div>


        {/* ── Locked state (hasMealAccess=false) ──────────────────────── */}
        {!hasAccess ? (
          <LockedState member={member} />
        ) : (
          <>
            <div className="gym-segmented" role="tablist" aria-label="Member data">
              <TabButton tab="meals" active={tab === 'meals'} onSelect={setTab}>
                Meals · last 30 days
              </TabButton>
              <TabButton tab="reports" active={tab === 'reports'} onSelect={setTab}>
                Reports · 12 weeks
              </TabButton>
            </div>


            <AnimatePresence mode="wait">
              {tab === 'meals' ? (
                <motion.div
                  key="meals"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <MealsTab query={mealsQuery} isOnline={isOnline} />
                </motion.div>
              ) : (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ReportsTab query={reportsQuery} isOnline={isOnline} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}


        <p className="gym-caption mt-2">
          Every time you open this member's data, an entry is written to the
          access log. Members can revoke sharing from their Profile at any time.
        </p>
      </PageShell>
    </MotionConfig>
  );
}


// ── Tabs ──────────────────────────────────────────────────────────────────


function TabButton({
  tab,
  active,
  onSelect,
  children,
}: {
  tab: Tab;
  active: boolean;
  onSelect: (t: Tab) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => {
        haptics.tap();
        onSelect(tab);
      }}
    >
      {active && (
        <motion.span
          layoutId="gym-tab-pill"
          className="gym-segmented-pill"
          transition={springTap}
        />
      )}
      <span className="gym-segmented-label">{children}</span>
    </button>
  );
}


// ── Meals tab ────────────────────────────────────────────────────────────


function MealsTab({
  query,
  isOnline,
}: {
  query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof gymOwnerService.getMemberActivity>>>>;
  isOnline: boolean;
}) {
  if (query.isLoading) return <TabSkeleton />;
  if (query.error) {
    return (
      <ErrorBlock
        title="Couldn't load meals"
        body={isOnline ? 'Try again in a moment.' : 'You are offline.'}
        onRetry={() => query.refetch()}
      />
    );
  }
  const result = query.data;
  if (!result || !result.ok) {
    return (
      <ErrorBlock
        title="Meals unavailable"
        body={result?.error ?? 'Could not load meals.'}
        onRetry={() => query.refetch()}
      />
    );
  }
  const rows = result.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="gym-glass">
        <div className="gym-empty">
          <div className="gym-empty-icon">
            <Utensils size={18} />
          </div>
          <div className="gym-empty-title">No meals logged</div>
          <div className="gym-empty-body">
            This member hasn't logged any meals in the last 30 days.
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="gym-glass">
      {rows.map((row, i) => (
        <motion.div
          key={row.mealId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionFadeSlide, delay: Math.min(i, 7) * 0.04 }}
        >
          <div className="gym-row">
            <div className="gym-row-main">
              <div className="gym-row-title" style={{ textTransform: 'capitalize' }}>
                {row.mealText}
              </div>
              <div className="gym-row-sub">
                {row.mealSlot ? `${capitalize(row.mealSlot)} · ` : ''}
                {formatDateTime(row.mealTime)}
              </div>
              <div className="gym-row-pills">
                <span className="gym-pill gym-pill-ended tabular-nums">
                  {Math.round(row.calories)} kcal
                </span>
                <span className="gym-pill gym-pill-share tabular-nums">
                  {row.protein.toFixed(1)}g P
                </span>
                <span className="gym-pill gym-pill-ended tabular-nums">
                  {row.carbs.toFixed(1)}g C
                </span>
                <span className="gym-pill gym-pill-ended tabular-nums">
                  {row.fat.toFixed(1)}g F
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}


// ── Reports tab ───────────────────────────────────────────────────────────


function ReportsTab({
  query,
  isOnline,
}: {
  query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof gymOwnerService.getMemberWeeklyReports>>>>;
  isOnline: boolean;
}) {
  if (query.isLoading) return <TabSkeleton />;
  if (query.error) {
    return (
      <ErrorBlock
        title="Couldn't load reports"
        body={isOnline ? 'Try again in a moment.' : 'You are offline.'}
        onRetry={() => query.refetch()}
      />
    );
  }
  const result = query.data;
  if (!result || !result.ok) {
    return (
      <ErrorBlock
        title="Reports unavailable"
        body={result?.error ?? 'Could not load reports.'}
        onRetry={() => query.refetch()}
      />
    );
  }
  const rows = result.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="gym-glass">
        <div className="gym-empty">
          <div className="gym-empty-icon">
            <ClipboardList size={18} />
          </div>
          <div className="gym-empty-title">No weekly reports yet</div>
          <div className="gym-empty-body">
            Weekly reports are generated after the member logs meals for at least
            three days in a week.
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="gym-glass">
      {rows.map((row, i) => (
        <motion.div
          key={`${row.weekStart}-${row.weekEnd}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionFadeSlide, delay: Math.min(i, 7) * 0.04 }}
        >
          <div className="gym-row">
            <div className="gym-row-main">
              <div className="gym-row-title">
                {row.weekStart} → {row.weekEnd}
              </div>
              <div className="gym-row-sub">
                {row.daysWithMeals}/7 days logged · {row.confidence}
              </div>
              <div className="gym-row-pills">
                <span className="gym-pill gym-pill-active tabular-nums">
                  Score {row.weeklyScore}
                </span>
                <span className="gym-pill gym-pill-ended tabular-nums">
                  {Math.round(row.avgCalories)} kcal avg
                </span>
                <span className="gym-pill gym-pill-share tabular-nums">
                  {row.avgProteinG.toFixed(1)}g P avg
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}


// ── Locked state ──────────────────────────────────────────────────────────


function LockedState({ member }: { member: GymMember }) {
  const reason =
    !member.isActive && !member.shareMealData
      ? 'access_ended_and_no_consent'
      : !member.isActive
      ? 'access_ended'
      : 'no_consent';


  const title =
    reason === 'no_consent'
      ? 'Member has not consented'
      : 'Member access has ended';


  const body =
    reason === 'no_consent'
      ? 'You can see this member redeemed a code, but meal data is only visible when they enable gym sharing from their Profile.'
      : reason === 'access_ended'
      ? `This member's gym access ended on ${formatDate(member.premiumUntil)}. Meal data is not available.`
      : `This member's gym access ended on ${formatDate(member.premiumUntil)} and they have not consented to share meal data.`;


  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionFadeSlide}
      className="gym-glass"
    >
      <div className="gym-locked">
        <div className="gym-locked-icon">
          <Lock size={20} />
        </div>
        <div className="gym-empty-title">{title}</div>
        <div className="gym-empty-body">{body}</div>
        {reason === 'no_consent' && (
          <p className="gym-caption">
            Ask them to open Profile → Gym membership → Gym sharing and turn it on.
          </p>
        )}
      </div>
    </motion.div>
  );
}


// ── Small blocks ──────────────────────────────────────────────────────────


function PageShell({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="page-enter px-4 pt-4 pb-6 min-h-[100dvh] bg-[#080809]">
      <div className="mx-auto w-full max-w-[640px] gym-stack">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to gym"
            className="gym-copy-btn"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="gym-label">Member</div>
          <div className="w-11" aria-hidden="true" />
        </div>
        {children}
      </div>
    </div>
  );
}


function ErrorBlock({
  title,
  body,
  onRetry,
  retryLabel = 'Try again',
}: {
  title: string;
  body: string;
  onRetry: () => void;
  retryLabel?: string;
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
          {retryLabel}
        </button>
      </div>
    </div>
  );
}


function TabSkeleton() {
  return (
    <div className="gym-glass" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="gym-row" aria-hidden="true">
          <div className="gym-row-main">
            <div className="gym-skeleton" style={{ height: 16, width: '70%' }} />
            <div className="gym-skeleton mt-1" style={{ height: 12, width: '50%' }} />
            <div className="gym-skeleton mt-1" style={{ height: 12, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}


function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <MotionConfig reducedMotion="user">
      <PageShell onBack={onBack}>
        <div>
          <div className="gym-skeleton" style={{ width: 120, height: 28, borderRadius: 6 }} />
          <div className="gym-skeleton mt-2" style={{ width: 220, height: 14 }} />
        </div>
        <div className="gym-skeleton" style={{ height: 44, borderRadius: 9999 }} />
        <TabSkeleton />
      </PageShell>
    </MotionConfig>
  );
}


// ── Helpers ───────────────────────────────────────────────────────────────


function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}


function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}


function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}