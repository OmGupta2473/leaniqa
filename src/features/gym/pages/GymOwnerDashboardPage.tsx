import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, MotionConfig } from 'motion/react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  KeyRound,
  Lock,
  Plus,
  Users,
  WifiOff,
} from 'lucide-react';
import { gymOwnerService, type OwnedGym, type PromoCodeRow, type GymMember } from '../services/gymOwnerService';
import { useToast } from '@/shared/components/Toast';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { haptics } from '@/shared/utils/haptics';
import { cn } from '@/shared/utils/utils';
import { devLog } from '@/shared/utils/logger';
import {
  springTap,
  transitionFadeSlide,
  transitionStagger,
} from '@/features/reports/components/motion';
import '../styles/gymOwner.css';

const ONLINE_CHIP = 'ml-auto flex items-center gap-1 rounded-full bg-[rgba(255,176,32,0.13)] px-2 py-0.5';
const ONLINE_CHIP_TEXT = 'text-[11px] font-semibold text-[#FFB020]';

export function GymOwnerDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOnline = useNetworkConnectivity();

  const gymsQuery = useQuery({
    queryKey: ['gymOwned'],
    queryFn: () => gymOwnerService.listOwnedGyms(),
  });
  const gyms: OwnedGym[] = gymsQuery.data ?? [];
  const gym = gyms[0] ?? null;

  const codesQuery = useQuery({
    queryKey: ['gymCodes', gym?.id],
    queryFn: () => gymOwnerService.listPromoCodes(gym!.id),
    enabled: !!gym,
  });
  const codes: PromoCodeRow[] = codesQuery.data ?? [];

  const membersQuery = useQuery({
    queryKey: ['gymMembers', gym?.id],
    queryFn: () => gymOwnerService.listGymMembers(gym!.id),
    enabled: !!gym,
  });
  const members: GymMember[] = membersQuery.data ?? [];

  const [isCodeSheetOpen, setCodeSheetOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = useCallback(
    (code: string) => {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        toast({ type: 'warning', message: 'Copy is not available here. Select the code manually.' });
        return;
      }
      navigator.clipboard
        .writeText(code)
        .then(() => {
          setCopiedCode(code);
          haptics.tap();
          window.setTimeout(() => setCopiedCode(null), 1500);
        })
        .catch((err) => {
          devLog('[gymOwner] clipboard write failed', err);
          toast({ type: 'error', message: 'Could not copy. Long-press the code to select it.' });
        });
    },
    [toast],
  );

const handleLockedTap = useCallback(
  (member: GymMember) => {
    haptics.tap();
    if (!member.isActive && !member.shareMealData) {
      toast({
        type: 'info',
        message: "This member's gym access has ended and they have not consented to share data.",
      });
      return;
    }
    if (!member.isActive) {
      toast({ type: 'info', message: "This member's gym access has ended." });
      return;
    }
    toast({
      type: 'info',
      message: 'This member has not consented to share meal data. Ask them to enable gym sharing in their Profile.',
    });
  },
  [toast],
);
  const activeMemberCount = useMemo(
    () => members.filter((m) => m.hasMealAccess).length,
    [members],
  );

  // ── Loading (initial only) ────────────────────────────────────────────
if (gymsQuery.isLoading || (gym && codesQuery.isLoading && membersQuery.isLoading)) {
    return <DashboardSkeleton />;
  }

  // ── No gym (shouldn't happen — GymOwnerRoute gates) ─────────────────
  if (!gym) {
    return (
      <PageShell>
        <ErrorState
          title="No gym found"
          body="Your account isn't linked to a gym. Contact support."
          onRetry={() => navigate('/dashboard')}
          retryLabel="Back to dashboard"
        />
      </PageShell>
    );
  }

  const codesError = codesQuery.error as Error | null;
const membersError = membersQuery.error as Error | null;

  return (
    <MotionConfig reducedMotion="user">
      <PageShell>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between"
        >
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
            className="gym-copy-btn"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="gym-label">Gym owner</div>
          <div className="w-11" aria-hidden="true" />
        </motion.div>

        <div>
          <h1 className="gym-title">{gym.name}</h1>
          <p className="gym-caption mt-1">
            {members.length === 0
  ? 'No members yet.'
  : `${members.length} ${members.length === 1 ? 'member' : 'members'} · ${activeMemberCount} ${activeMemberCount === 1 ? 'shares' : 'share'} data`}
          </p>
        </div>

        {!isOnline && (
          <div className={ONLINE_CHIP}>
            <WifiOff size={12} className="text-[#FFB020]" />
            <span className={ONLINE_CHIP_TEXT}>Offline</span>
          </div>
        )}

        {/* ── Codes section ────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionFadeSlide }}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="gym-label">Promo codes</h2>
            <button
              type="button"
              onClick={() => setCodeSheetOpen(true)}
              className="gym-primary-btn"
            >
              <Plus size={14} strokeWidth={2.5} />
              New code
            </button>
          </div>

          {codesQuery.isLoading ? (
            <div className="gym-glass">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : codesError ? (
            <div className="gym-glass">
              <ErrorState
                title="Couldn't load codes"
                body={isOnline ? 'Try again in a moment.' : 'You are offline.'}
                onRetry={() => codesQuery.refetch()}
              />
            </div>
          ) : codes.length === 0 ? (
            <div className="gym-glass">
              <EmptyState
                icon={<KeyRound size={18} />}
                title="No codes yet"
                body="Generate your first promo code to give members a month of premium."
                cta={
                  <button
                    type="button"
                    onClick={() => setCodeSheetOpen(true)}
                    className="gym-primary-btn"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Generate code
                  </button>
                }
              />
            </div>
          ) : (
            <div className="gym-glass">
              <div className="max-h-[360px] overflow-y-auto pr-1 -mr-1">
                {codes.map((code, i) => (
                  <motion.div
                    key={code.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...transitionFadeSlide,
                      delay: Math.min(i, 7) * transitionStagger,
                    }}
                  >
                    <CodeRow
                      code={code}
                      copied={copiedCode === code.code}
                      onCopy={() => handleCopy(code.code)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* ── Members section ──────────────────────────────────────────── */}
                <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionFadeSlide, delay: 0.08 }}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="gym-label">Members</h2>
            <span className="gym-caption tabular-nums">{members.length}</span>
          </div>

          {membersQuery.isLoading ? (
            <div className="gym-glass">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : membersQuery.error ? (
            <div className="gym-glass">
              <ErrorState
                title="Couldn't load members"
                body={isOnline ? 'Try again in a moment.' : 'You are offline.'}
                onRetry={() => membersQuery.refetch()}
              />
            </div>
          ) : members.length === 0 ? (
            <div className="gym-glass">
              <EmptyState
                icon={<Users size={18} />}
                title="No members yet"
                body="When a member redeems one of your codes, they'll appear here."
              />
            </div>
          ) : (
            <div className="gym-glass">
              {members.map((member, i) => (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    ...transitionFadeSlide,
                    delay: Math.min(i, 7) * transitionStagger,
                  }}
                >
                  <MemberRow
                    member={member}
                    onOpen={() => {
                      haptics.tap();
                      navigate(`/gym/${gym.id}/member/${member.userId}`);
                    }}
                    onLockedTap={() => handleLockedTap(member)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        <p className="gym-caption mt-2">
          Owners can only see meal data for members who consented and still
          have active gym access.
        </p>
      </PageShell>

      <NewCodeSheet
        isOpen={isCodeSheetOpen}
        gymId={gym.id}
        onClose={() => setCodeSheetOpen(false)}
      />
    </MotionConfig>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter px-4 pt-4 pb-6 min-h-[100dvh] bg-[#080809]">
      <div className="mx-auto w-full max-w-[640px] gym-stack">{children}</div>
    </div>
  );
}

function CodeRow({
  code,
  copied,
  onCopy,
}: {
  code: PromoCodeRow;
  copied: boolean;
  onCopy: () => void;
}) {
  const exhausted =
    code.maxRedemptions !== null && code.currentRedemptions >= code.maxRedemptions;
  const statusLabel = !code.active ? 'Inactive' : exhausted ? 'Exhausted' : 'Active';
  const statusClass =
    !code.active || exhausted ? 'gym-pill gym-pill-ended' : 'gym-pill gym-pill-active';

  return (
    <div className="gym-row">
      <div className="gym-row-main">
        <div className="gym-row-title gym-mono">{code.code}</div>
        <div className="gym-row-pills">
          <span className={statusClass}>{statusLabel}</span>
          <span className="gym-pill gym-pill-ended">
            {code.currentRedemptions}
            {code.maxRedemptions !== null ? ` / ${code.maxRedemptions}` : ''} used
          </span>
          <span className="gym-pill gym-pill-ended">{code.durationDays}d</span>
        </div>
      </div>
      <div className="gym-row-end">
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copied' : `Copy code ${code.code}`}
          data-copied={copied ? 'true' : 'false'}
          className="gym-copy-btn"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  onOpen,
  onLockedTap,
}: {
  member: GymMember;
  onOpen: () => void;
  onLockedTap: () => void;
}) {
  const displayName = member.name ?? member.userId.slice(0, 8);
  const unlocked = member.hasMealAccess;

  return (
    <button
      type="button"
      onClick={unlocked ? onOpen : onLockedTap}
      className="gym-row"
      aria-label={
        unlocked
          ? `Open activity for ${displayName}`
          : `${displayName} — data not available`
      }
      aria-disabled={unlocked ? undefined : 'true'}
    >
      <div className="gym-row-main">
        <div className="gym-row-title">{displayName}</div>
        <div className="gym-row-pills">
          <span className={cn('gym-pill', member.isActive ? 'gym-pill-active' : 'gym-pill-ended')}>
            {member.isActive ? 'Premium' : 'Ended'}
          </span>
          {member.shareMealData && (
            <span className="gym-pill gym-pill-share">Sharing</span>
          )}
          {!unlocked && (
            <span className="gym-pill gym-pill-ended">
              <Lock size={10} strokeWidth={2.5} />
              Locked
            </span>
          )}
        </div>
        <div className="gym-row-sub">
          {member.isActive
            ? `Until ${formatDate(member.premiumUntil)}`
            : `Ended ${formatDate(member.premiumUntil)}`}
        </div>
      </div>
      <div className="gym-row-end">
        {unlocked ? <ChevronRight size={18} /> : <Lock size={16} />}
      </div>
    </button>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="gym-empty">
      <div className="gym-empty-icon">{icon}</div>
      <div className="gym-empty-title">{title}</div>
      <div className="gym-empty-body">{body}</div>
      {cta && <div className="mt-1">{cta}</div>}
    </div>
  );
}

function ErrorState({
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
  );
}

function SkeletonRow() {
  return (
    <div className="gym-row" aria-hidden="true">
      <div className="gym-row-main">
        <div className="gym-skeleton" style={{ height: 16, width: '60%' }} />
        <div className="gym-skeleton mt-1" style={{ height: 12, width: '40%' }} />
      </div>
      <div className="gym-skeleton" style={{ height: 24, width: 44, borderRadius: 12 }} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <MotionConfig reducedMotion="user">
      <PageShell>
        <div className="flex items-center justify-between">
          <div className="gym-skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <div className="gym-skeleton" style={{ width: 80, height: 12 }} />
          <div style={{ width: 44 }} />
        </div>
        <div>
          <div className="gym-skeleton" style={{ width: 180, height: 28, borderRadius: 6 }} />
          <div className="gym-skeleton mt-2" style={{ width: 220, height: 14 }} />
        </div>
        <div className="gym-glass">
          <SkeletonRow />
          <SkeletonRow />
        </div>
        <div className="gym-glass">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </PageShell>
    </MotionConfig>
  );
}

// ── New-code sheet ────────────────────────────────────────────────────────

function NewCodeSheet({
  isOpen,
  gymId,
  onClose,
}: {
  isOpen: boolean;
  gymId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inlineError, setInlineError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => gymOwnerService.generatePromoCode(gymId),
    onSuccess: (result) => {
      if (!result.ok || !result.data) {
        setInlineError(result.error ?? 'Could not create the code.');
        return;
      }
      haptics.success();
      toast({
        type: 'success',
        message: `Code ${result.data.code} created.`,
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['gymCodes', gymId] });
      setInlineError(null);
      onClose();
    },
    onError: () => setInlineError('Could not create the code. Please try again.'),
  });

  const handleSubmit = () => {
    if (mutation.isPending) return;
    setInlineError(null);
    mutation.mutate();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="auto">
      <div className="px-5 pt-4 pb-6">
        <h2 className="gym-card-title mb-1">New promo code</h2>
        <p className="gym-caption mb-4">
          Generates one month of free premium for up to five members. Members
          redeem it from their Profile.
        </p>

        <div className="gym-row-pills mb-5">
          <span className="gym-pill gym-pill-active">30 days premium</span>
          <span className="gym-pill gym-pill-ended">5 members per code</span>
        </div>

        {inlineError && (
          <div role="alert" className="gym-field-error mb-3">
            {inlineError}
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="gym-secondary-btn flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="gym-primary-btn flex-1"
          >
            {mutation.isPending ? 'Creating…' : 'Create code'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}