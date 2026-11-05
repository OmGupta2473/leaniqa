import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, ChevronRight, Sunrise, Sun, Moon, Coffee, Utensils, Lock } from 'lucide-react';
import { gymOwnerService, type GymMember, type MemberActivityRow } from '../../services/gymOwnerService';
import { MealSlotRow, formatMacro } from '@/features/nutrition/components/MealSlotRow';
import {
  getKolkataDateString,
  kolkataDateStringToUtcMidnight,
  shiftKolkataDateString,
} from '@/shared/utils/timezone';
import { haptics } from '@/shared/utils/haptics';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import '../../styles/gymOwner.css';

interface MemberMealsViewProps {
  gymId: string;
  member: GymMember;
}

const SLOTS = [
  { id: 'breakfast', label: 'Breakfast', timeRange: '6 am – 12 pm', icon: <Sunrise size={20} /> },
  { id: 'lunch', label: 'Lunch', timeRange: '12 pm – 6 pm', icon: <Sun size={20} /> },
  { id: 'dinner', label: 'Dinner', timeRange: '6 pm – 10 pm', icon: <Moon size={20} /> },
  { id: 'snack', label: 'Snack', timeRange: 'Anytime', icon: <Coffee size={20} /> },
] as const;

/**
 * Owner-side read-only view of a member's daily meals. Data is scoped to
 * one day (matching the member's /meals) and every fetch calls the audited
 * RPC, which fires exactly one gym_member_access_log row per view (Session
 * 3 migration).
 *
 * Not used by the member's own MealLoggerPage — that page stays self-scoped
 * via auth.uid(). This component is the only caller of the owner-facing
 * member activity RPC.
 */
export function MemberMealsView({ gymId, member }: MemberMealsViewProps) {
  const isOnline = useNetworkConnectivity();
  const today = getKolkataDateString();
  const [selectedDate, setSelectedDate] = useState(today);

  const dayBounds = useMemo(
    () => ({
      sinceIso: kolkataDateStringToUtcMidnight(selectedDate).toISOString(),
      untilIso: kolkataDateStringToUtcMidnight(
        shiftKolkataDateString(selectedDate, 1),
      ).toISOString(),
    }),
    [selectedDate],
  );

  const query = useQuery({
    queryKey: ['gymMemberMeals', gymId, member.userId, selectedDate],
    queryFn: () =>
      gymOwnerService.getMemberActivity(
        gymId,
        member.userId,
        dayBounds.sinceIso,
        dayBounds.untilIso,
      ),
    // 0 so that navigating days or remounting tabs always re-evaluates the
    // R1 gate. If the member revokes consent mid-session, the RPC raises
    // member_not_shareable and we render the revoked block below.
    staleTime: 0,
  });

  const result = query.data;
  const rows: MemberActivityRow[] = result?.ok ? result.data ?? [] : [];

  const rowsBySlot = useMemo(() => {
    const grouped: Record<string, MemberActivityRow[]> = {
      breakfast: [], lunch: [], dinner: [], snack: [],
    };
    for (const row of rows) {
      const slot = (row.mealSlot ?? '').toLowerCase();
      const bucket = ['breakfast', 'lunch', 'dinner'].includes(slot) ? slot : 'snack';
      grouped[bucket].push(row);
    }
    return grouped;
  }, [rows]);

  const firstRow = rows[0];
  const targetKcal = firstRow?.targetKcal ?? 0;
  const targetProtein = firstRow?.proteinTarget ?? 0;
  const targetCarbs = firstRow?.carbsTarget ?? 0;
  const targetFat = firstRow?.fatTarget ?? 0;
  const eatenKcal = Math.round(rows.reduce((s, r) => s + r.calories, 0));
  const eatenProtein = Math.round(rows.reduce((s, r) => s + r.protein, 0) * 10) / 10;
  const eatenCarbs = Math.round(rows.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
  const eatenFat = Math.round(rows.reduce((s, r) => s + r.fat, 0) * 10) / 10;

  const isToday = selectedDate === today;
  const labels = dateLabels(selectedDate);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { haptics.tap(); setSelectedDate(shiftKolkataDateString(selectedDate, -1)); }}
          aria-label="Previous day"
          className="gym-copy-btn"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="gym-card-title">{labels.primary}</div>
          <div className="gym-caption">{labels.secondary}</div>
        </div>
        <button
          type="button"
          onClick={() => { haptics.tap(); setSelectedDate(shiftKolkataDateString(selectedDate, 1)); }}
          disabled={isToday}
          aria-label="Next day"
          className="gym-copy-btn"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.error ? (
        <ErrorBlock
          title="Couldn't load meals"
          body={isOnline ? 'Try again in a moment.' : 'You are offline.'}
          onRetry={() => query.refetch()}
        />
      ) : result && !result.ok ? (
        result.errorCode === 'member_not_shareable' ? (
          <RevokedBlock memberName={member.name} />
        ) : (
          <ErrorBlock
            title="Meals unavailable"
            body={result.error ?? 'Could not load meals.'}
            onRetry={() => query.refetch()}
          />
        )
      ) : rows.length === 0 ? (
        <div className="gym-glass">
          <div className="gym-empty">
            <div className="gym-empty-icon"><Utensils size={18} /></div>
            <div className="gym-empty-title">No meals logged on this day</div>
            <div className="gym-empty-body">
              Navigate to another day to see {member.name ?? 'this member'}'s meals.
            </div>
          </div>
        </div>
      ) : (
        <>
          <DailySummaryCard
            eatenKcal={eatenKcal}
            eatenProtein={eatenProtein}
            eatenCarbs={eatenCarbs}
            eatenFat={eatenFat}
            targetKcal={targetKcal}
            targetProtein={targetProtein}
            targetCarbs={targetCarbs}
            targetFat={targetFat}
          />

          <div>
            {SLOTS.map((slot) => (
              <MealSlotRow
                key={slot.id}
                slot={slot.id}
                icon={slot.icon}
                label={slot.label}
                timeRange={slot.timeRange}
                meals={rowsBySlot[slot.id].map((r) => ({
                  id: r.mealId,
                  meal_text: r.mealText,
                  calories: r.calories,
                  protein: r.protein,
                  fat: r.fat,
                  carbs: r.carbs,
                  fiber: r.fiber,
                  meal_time: r.mealTime,
                  meal_source: 'owner_read_only' as any,
                }))}
                readOnly
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Daily summary card (eaten vs target) ──────────────────────────────────

function DailySummaryCard({
  eatenKcal, eatenProtein, eatenCarbs, eatenFat,
  targetKcal, targetProtein, targetCarbs, targetFat,
}: {
  eatenKcal: number; eatenProtein: number; eatenCarbs: number; eatenFat: number;
  targetKcal: number; targetProtein: number; targetCarbs: number; targetFat: number;
}) {
  return (
    <div className="rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-5">
      <div className="flex justify-between items-center mb-4">
        <span className="gym-label">Daily summary</span>
        <span className="gym-caption tabular-nums">
          {formatMacro(eatenKcal)} / {targetKcal} kcal
        </span>
      </div>

      <MacroBar label="Calories" value={eatenKcal} target={targetKcal} color={eatenKcal > targetKcal ? '#FF4D1C' : '#D4FF00'} />
      <MacroBar label="Protein" value={eatenProtein} target={targetProtein} color="#378ADD" />
      <MacroBar label="Carbs" value={eatenCarbs} target={targetCarbs} color="#FFFFFF" />
      <MacroBar label="Fat" value={eatenFat} target={targetFat} color="#FFFFFF" />

      <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
        {[
          { label: 'Kcal', val: eatenKcal, color: '#FF4D1C' },
          { label: 'Protein', val: eatenProtein, color: '#378ADD' },
          { label: 'Fat', val: eatenFat, color: '#FFFFFF' },
          { label: 'Carbs', val: eatenCarbs, color: '#FFFFFF' },
        ].map((item) => (
          <div key={item.label} className="text-center flex flex-col items-center">
            <div className="gym-headline tabular-nums" style={{ color: item.color }}>
              {formatMacro(item.val)}
            </div>
            <div className="gym-label mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroBar({
  label, value, target, color,
}: {
  label: string; value: number; target: number; color: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="gym-caption">{label}</span>
        <span className="gym-caption tabular-nums">
          {formatMacro(value)} / {target}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
        <div
          className="h-full rounded-full origin-left"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Empty / error / revoked blocks ────────────────────────────────────────

function ErrorBlock({
  title, body, onRetry,
}: {
  title: string; body: string; onRetry: () => void;
}) {
  return (
    <div className="gym-glass">
      <div className="gym-error">
        <div className="gym-error-icon"><AlertTriangle size={18} /></div>
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
        <div className="gym-locked-icon"><Lock size={20} /></div>
        <div className="gym-empty-title">Sharing was turned off</div>
        <div className="gym-empty-body">
          {memberName ?? 'This member'} has revoked gym sharing. Meals are no
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
      {[0, 1, 2].map((i) => (
        <div key={i} className="gym-row" aria-hidden="true">
          <div className="gym-row-main">
            <div className="gym-skeleton" style={{ height: 16, width: '70%' }} />
            <div className="gym-skeleton mt-1" style={{ height: 12, width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function dateLabels(dateStr: string): { primary: string; secondary: string } {
  const today = getKolkataDateString();
  const yesterday = shiftKolkataDateString(today, -1);
  const [y, m, d] = dateStr.split('-').map(Number);
  const dObj = new Date(y, m - 1, d);
  const primary =
    dateStr === today ? 'Today'
    : dateStr === yesterday ? 'Yesterday'
    : dObj.toLocaleDateString('en-GB', { weekday: 'long' });
  const secondary = dObj.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  return { primary, secondary };
}