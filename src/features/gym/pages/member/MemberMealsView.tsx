import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Lock,
} from 'lucide-react';
import { gymOwnerService, type GymMember, type MemberActivityRow } from '../../services/gymOwnerService';
import { MealSlotRow, formatMacro } from '@/features/nutrition/components/MealSlotRow';
import {
  getKolkataDateString,
  kolkataDateStringToUtcMidnight,
  shiftKolkataDateString,
} from '@/shared/utils/timezone';
import { haptics } from '@/shared/utils/haptics';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { cn } from '@/shared/utils/utils';
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
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const row of rows) {
      const slot = (row.mealSlot ?? '').toLowerCase();
      const bucket = ['breakfast', 'lunch', 'dinner'].includes(slot) ? slot : 'snack';
      grouped[bucket].push(row);
    }
    return grouped;
  }, [rows]);

  // Targets come from the RPC payload (first row).
  // If a day is empty, we cannot render the summary card (no targets returned),
  // but the member's /meals page falls back to profile targets. We fall back
  // to 0 here to keep the summary hidden when empty, matching the "no data" state.
  const firstRow = rows[0];
  const targetKcal = firstRow?.targetKcal ?? 0;
  const targetProtein = firstRow?.proteinTarget ?? 0;
  const targetCarbs = firstRow?.carbsTarget ?? 0;
  const targetFat = firstRow?.fatTarget ?? 0;

  const eatenKcal = Math.round(rows.reduce((s, r) => s + r.calories, 0));
  const eatenProtein = Math.round(rows.reduce((s, r) => s + r.protein, 0) * 10) / 10;
  const eatenCarbs = Math.round(rows.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
  const eatenFat = Math.round(rows.reduce((s, r) => s + r.fat, 0) * 10) / 10;

  const remainingKcal = targetKcal - eatenKcal;
  const remainingProtein = targetProtein - eatenProtein;

  const calPct = targetKcal > 0 ? Math.min(eatenKcal / targetKcal, 1) : 0;
  const proPct = targetProtein > 0 ? Math.min(eatenProtein / targetProtein, 1) : 0;

  const isToday = selectedDate === today;

  const handlePrevDay = () => {
    haptics.tap();
    setSelectedDate(shiftKolkataDateString(selectedDate, -1));
  };

  const handleNextDay = () => {
    if (isToday) return;
    haptics.tap();
    setSelectedDate(shiftKolkataDateString(selectedDate, 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header: Meal Log + Date Nav */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h2 className="text-[28px] font-semibold text-white tracking-tight">Meal Log</h2>
          <div className="text-[14px] font-medium text-[rgba(235,235,245,0.5)] mt-0.5">
            {formatDateLabel(selectedDate)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevDay}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer active:scale-95 transition-all duration-200"
            aria-label="Previous Day"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="text-[15px] font-semibold text-white min-w-[85px] text-center tracking-tight">
            {formatDateLabel(selectedDate)}
          </span>
          <button
            type="button"
            onClick={handleNextDay}
            disabled={isToday}
            className={cn(
              'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200',
              isToday
                ? 'opacity-30 cursor-not-allowed'
                : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer active:scale-95',
            )}
            aria-label="Next Day"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>
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
      ) : (
        <>
          {/* Daily Summary Card (Only if there are meals, otherwise targets are unknown) */}
          {rows.length > 0 && (
            <div className="mb-2 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-5 shadow-sm backdrop-blur-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                <div className="text-[12px] font-semibold uppercase tracking-widest text-[rgba(235,235,245,0.5)]">
                  Daily Summary
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div
                      className="text-[16px] font-bold"
                      style={{
                        color:
                          remainingKcal > 0
                            ? remainingKcal / targetKcal > 0.2
                              ? '#D4FF00'
                              : remainingKcal / targetKcal > 0.05
                              ? '#FFB347'
                              : '#FF4D1C'
                            : '#FF4D1C',
                      }}
                    >
                      {remainingKcal > 0
                        ? `${formatMacro(remainingKcal)} kcal`
                        : `Over budget by ${formatMacro(Math.abs(remainingKcal))} kcal`}
                    </div>
                    {remainingProtein <= 0 ? (
                      <span className="text-[13px] text-[rgba(255,255,255,0.4)]">
                        Protein target met
                      </span>
                    ) : (
                      <span className="text-[13px] text-[rgba(255,255,255,0.6)]">
                        {formatMacro(remainingProtein)}g protein left today
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Calories bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5 items-end">
                  <span className="text-[13px] font-medium text-[rgba(235,235,245,0.5)]">Calories</span>
                  <span className="text-[14px] font-bold text-white tracking-tight">
                    {eatenKcal}{' '}
                    <span className="text-[11px] font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                      / {targetKcal}
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full w-full rounded-full origin-left transition-transform duration-1000 ease-out will-change-transform"
                    style={{
                      transform: `translateX(-${100 - calPct * 100}%)`,
                      background: eatenKcal > targetKcal ? '#FF4D1C' : '#D4FF00',
                    }}
                  />
                </div>
              </div>

              {/* Protein bar */}
              <div>
                <div className="flex justify-between mb-1.5 items-end">
                  <span className="text-[13px] font-medium text-[rgba(235,235,245,0.5)]">Protein</span>
                  <span className="text-[14px] font-bold text-white tracking-tight">
                    {eatenProtein}g{' '}
                    <span className="text-[11px] font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">
                      / {targetProtein}g
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full w-full rounded-full bg-[#378ADD] origin-left transition-transform duration-1000 ease-out will-change-transform"
                    style={{ transform: `translateX(-${100 - proPct * 100}%)` }}
                  />
                </div>
              </div>

              {/* Macros row */}
              <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                {[
                  { label: 'Kcal', val: eatenKcal, target: targetKcal, unit: '', color: '#FF4D1C' },
                  { label: 'Protein', val: eatenProtein, target: targetProtein, unit: 'g', color: '#378ADD' },
                  { label: 'Fat', val: eatenFat, target: targetFat, unit: 'g', color: 'white' },
                  { label: 'Carbs', val: eatenCarbs, target: targetCarbs, unit: 'g', color: 'white' },
                ].map((item) => (
                  <div key={item.label} className="text-center flex flex-col items-center">
                    <div className="text-[16px] font-bold tracking-tight" style={{ color: item.color }}>
                      {formatMacro(item.val)}
                      <span className="text-[12px]">{item.unit}</span>
                    </div>
                    <div className="text-[10px] text-[rgba(235,235,245,0.5)] uppercase tracking-widest mt-0.5 font-medium">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meal Slots */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-[12px] font-semibold uppercase tracking-widest text-[rgba(235,235,245,0.5)]">
                Meal Log
              </div>
            </div>

            {rows.length === 0 && (
              <div className="gym-glass mb-4">
                <div className="gym-empty">
                  <div className="gym-empty-icon">
                    <Utensils size={18} />
                  </div>
                  <div className="gym-empty-title">No meals logged on this day</div>
                  <div className="gym-empty-body">
                    Navigate to another day to see {member.name ?? 'this member'}'s meals.
                  </div>
                </div>
              </div>
            )}

            {rows.length > 0 &&
              SLOTS.map((slot) => (
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

// ── Helper components ─────────────────────────────────────────────────────

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

function formatDateLabel(dateStr: string): string {
  const today = getKolkataDateString();
  const yesterday = shiftKolkataDateString(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}