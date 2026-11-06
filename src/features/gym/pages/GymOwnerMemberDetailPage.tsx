import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, MotionConfig, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ChevronLeft,
  Lock,
} from 'lucide-react';
import { gymOwnerService, type GymMember } from '../services/gymOwnerService';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { haptics } from '@/shared/utils/haptics';
import { cn } from '@/shared/utils/utils';
import {
  springTap,
  transitionFadeSlide,
} from '@/features/reports/components/motion';
import { MemberMealsView } from './member/MemberMealsView';
import { MemberWeeklyView } from './member/MemberWeeklyView';
import '../styles/gymOwner.css';

type Tab = 'meals' | 'reports';

export function GymOwnerMemberDetailPage() {
  const navigate = useNavigate();
  const { gymId, memberId } = useParams<{ gymId: string; memberId: string }>();
  const isOnline = useNetworkConnectivity();
  const [tab, setTab] = useState<Tab>('meals');

  const detailQuery = useQuery({
    queryKey: ['gymMemberDetail', gymId, memberId],
    queryFn: () => gymOwnerService.getMemberDetail(gymId!, memberId!),
    enabled: !!gymId && !!memberId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const memberResult = detailQuery.data;
  const member: GymMember | null =
    memberResult?.ok && memberResult.data ? memberResult.data : null;
  const hasAccess = member?.hasMealAccess === true;

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

  if (detailQuery.isLoading) {
    return <DetailSkeleton onBack={() => navigate('/gym')} />;
  }

  if (memberResult && !memberResult.ok) {
    return (
      <PageShell onBack={() => navigate('/gym')}>
        <ErrorBlock
          title="Couldn't load member"
          body={
            memberResult.error ??
            (isOnline ? 'Try again in a moment.' : 'You are offline.')
          }
          onRetry={() => detailQuery.refetch()}
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
                Meals
              </TabButton>
              <TabButton tab="reports" active={tab === 'reports'} onSelect={setTab}>
                Reports
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
                  <MemberMealsView gymId={gymId} member={member} />
                </motion.div>
              ) : (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <MemberWeeklyView gymId={gymId} member={member} />
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