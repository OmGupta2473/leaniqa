import { useChatStore } from '@/app/store';
import { useUserStore } from '@/features/profile/store/userStore';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { profileService } from '../services/profileService';
import { useState, useMemo } from 'react';
import { ChevronLeft, LogOut, AlertTriangle, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { computeProjection } from '@/shared/utils/projectionEngine';
import { computeMaintenancePlan } from '@/shared/utils/paceEngine';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '@/features/auth/services/authService';
import { haptics } from '@/shared/utils/haptics';
import { subscriptionService } from '@/features/pricing/services/subscriptionService';
import { EditProfileModal } from '../components/EditProfileModal';
import { EditNutritionModal } from '../components/EditNutritionModal';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { ProfileSkeleton } from '@/shared/components/Skeletons';

function displayVal(val: any) {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'number') {
    if (isNaN(val)) return '—';
    return Number.isInteger(val) ? val : parseFloat(val.toFixed(1));
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== '') {
      return Number.isInteger(num) ? num : parseFloat(num.toFixed(1));
    }
  }
  return val;
}
export function ProfilePage() {
  const navigate = useNavigate();
  const isOnline = useNetworkConnectivity();
  const queryClient = useQueryClient();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });

  const { profileData: calculated } = useCalculatedProfile();
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getSubscriptionStatus()
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await profileService.deleteGoal();
      await profileService.deleteProfile();
    },
    onSuccess: () => {
      useUserStore.getState().clearUserStore();
      useChatStore.getState().clearChatStore();
      queryClient.setQueryData(['profile'], null);
      queryClient.setQueryData(['goal'], null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      haptics.success();
      navigate('/onboarding');
    },
  });

  const { name, gender, age, activityLevel, dailyCalorieGoal, targetMacros, proteinMid } = calculated;

  const targetCalories = Math.round(dailyCalorieGoal ?? 0);
  const maintenanceKcal = Math.round(profile?.maintenance_kcal ?? 0);
  const goalType = goal?.goal_type;

  const maintenance = useMemo(() => {
    if (!profile?.weight || !profile?.maintenance_kcal) return null;
    try {
      return computeMaintenancePlan({
        weightKg: profile.weight,
        maintenanceKcal: profile.maintenance_kcal,
      });
    } catch {
      return null;
    }
  }, [profile?.weight, profile?.maintenance_kcal]);

  // Projected Progress — pure math from the shared projection engine (cbd0960).
  // Falls back to null (and a "Complete your plan" message) when the plan is
  // incomplete or inputs are missing, so computeProjection never throws here.
  const projection = useMemo(() => {
    if (!profile || !goal || !goalType || !profile.weight || !maintenanceKcal || !targetCalories) {
      return null;
    }
    return computeProjection({
      weightKg: profile.weight,
      targetWeightKg: goal.target_weight ?? null,
      goalType,
      dailyCalorieTarget: targetCalories,
      maintenanceKcal,
    });
  }, [profile, goal, goalType, maintenanceKcal, targetCalories]);

  const markers = useMemo(() => {
    if (!projection) return [];
    const now = projection.projectionPoints[0].estimatedWeightKg;
    const w8 = projection.projectionPoints[1].estimatedWeightKg;
    const w12 = projection.projectionPoints[2].estimatedWeightKg;
    const goalWeight = goal?.target_weight ?? w12; // fallback to 12-week weight
    return [
      { label: 'Now', value: `${now.toFixed(1)} kg` },
      { label: '8 wks', value: `${w8.toFixed(1)} kg` },
      { label: '12 wks', value: `${w12.toFixed(1)} kg` },
      { label: 'Goal', value: `${goalWeight.toFixed(1)} kg` },
    ];
  }, [projection, goal]);

  const maxWeeks = 12;

  const goalLabel = goalType === 'cut' ? 'Lose Fat'
                  : goalType === 'recomp' ? 'Recomp'
                  : goalType === 'bulk' ? 'Build Muscle'
                  : 'Set your goal';

  const GoalIcon = goalType === 'cut' ? TrendingDown
                 : goalType === 'recomp' ? Target
                 : goalType === 'bulk' ? TrendingUp
                 : Target;

  const dietLabel = !profile?.dietary_preference ? '—'
                  : profile.dietary_preference === 'veg' ? 'Vegetarian'
                  : profile.dietary_preference === 'egg' ? 'Eggetarian'
                  : 'Non-veg';

  const planLabel = subscription?.isPremium ? 'Serious plan' : 'Free plan';
  const planSubtitle = subscription?.isPremium
    ? 'Unlimited AI parsing unlocked'
    : 'Unlock unlimited AI parsing';

  if (isLoading) {
    if (!isOnline) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex flex-col items-center justify-center px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-[rgba(255,255,255,0.2)] mb-4" />
          <h2 className="text-[18px] font-semibold text-white mb-2">You're offline</h2>
          <p className="text-[14px] text-[rgba(255,255,255,0.6)]">
            Connect to the internet to load your profile for the first time.
          </p>
          <button onClick={() => navigate('/dashboard')} className="mt-8 text-[#D4FF00] font-medium text-[15px]">
            Return to Dashboard
          </button>
        </div>
      );
    }
    return <ProfileSkeleton />;
  }

  return (
    <div className="page-enter min-h-[100dvh] bg-[#0A0A0A] w-full px-[clamp(1rem,4vw,1.5rem)] pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+100px)]">
      <div className="w-full max-w-md mx-auto md:max-w-2xl lg:max-w-6xl">

        <header className="md:rounded-2xl md:border md:border-zinc-800/60 md:bg-zinc-900/40 mb-[clamp(1rem,2.4dvh,1.5rem)] md:mb-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
          <ChevronLeft size={18} className="text-white" />
        </button>
        <div className="text-[17px] font-semibold text-white tracking-tight">Profile</div>
        <div className="w-8" />
      </div>

      {/* Avatar & basic info (greeting preserved) */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.08)] text-[28px] font-semibold flex items-center justify-center text-white mb-4 border-[0.5px] border-[rgba(255,255,255,0.15)]">
          {name ? name.substring(0, 2).toUpperCase() : 'U'}
        </div>
        <div className="text-[24px] font-bold text-white tracking-tight mb-2">{name || 'User'}</div>
        <div className="flex gap-2">
          <div className="bg-[rgba(255,255,255,0.06)] border-[0.5px] border-[rgba(255,255,255,0.06)] px-3 py-1 rounded-full text-[12px] font-medium text-[rgba(255,255,255,0.6)]">
            {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '—'}
          </div>
          <div className="bg-[rgba(255,255,255,0.06)] border-[0.5px] border-[rgba(255,255,255,0.06)] px-3 py-1 rounded-full text-[12px] font-medium text-[rgba(255,255,255,0.6)]">
            {displayVal(age)} yrs
          </div>
          <div className="bg-[rgba(255,255,255,0.06)] border-[0.5px] border-[rgba(255,255,255,0.06)] px-3 py-1 rounded-full text-[12px] font-medium text-[rgba(255,255,255,0.6)]">
            {displayVal(activityLevel)}
          </div>
        </div>
      </div>
    </header>

    <div>
      <div className="grid grid-cols-1 gap-[clamp(0.6rem,1.6dvh,1rem)] md:grid-cols-2 md:gap-4">

        {/* Card 1 — Your Plan */}
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]">
          <div className="flex items-center justify-between mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
            <div className="text-[clamp(0.65rem,1.7dvh,0.78rem)] uppercase tracking-wider text-zinc-500">
              Your plan
            </div>
            <button
              onClick={() => setShowNutritionModal(true)}
              className="text-[clamp(0.68rem,1.75dvh,0.8rem)] text-[#D4FF00] hover:underline underline-offset-2"
            >
              Edit ›
            </button>
          </div>

          <div className="flex items-baseline gap-2 mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
            <GoalIcon className="w-5 h-5 text-[#D4FF00]" />
            <div className="text-[clamp(0.9rem,2.3dvh,1.05rem)] font-semibold text-white">
              {goalLabel}
            </div>
          </div>

          <div className="text-[clamp(1.5rem,4.5dvh,1.85rem)] font-bold tabular-nums text-white mb-1">
            {targetCalories || '—'} <span className="text-[clamp(0.72rem,1.9dvh,0.85rem)] text-zinc-500 font-medium">kcal</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-[clamp(0.5rem,1.4dvh,0.75rem)]">
            {[
              { label: 'Protein', value: targetMacros?.protein ?? proteinMid },
              { label: 'Fat', value: targetMacros?.fat },
              { label: 'Carbs', value: targetMacros?.carbs },
            ].map((macro) => (
              <div key={macro.label} className="rounded-xl bg-zinc-800/50 border border-zinc-800 px-2 py-2 text-center">
                <div className="text-[clamp(0.6rem,1.55dvh,0.7rem)] uppercase tracking-wider text-zinc-500 mb-0.5">
                  {macro.label}
                </div>
                <div className="text-[clamp(0.78rem,2dvh,0.95rem)] font-semibold text-white tabular-nums">
                  {displayVal(macro.value)}
                  {macro.value != null && <span className="text-zinc-500 text-[0.75em] ml-0.5">g</span>}
                </div>
              </div>
            ))}
          </div>
</section>
        {maintenance && (
          <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]">
            <div className="flex items-center justify-between mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
              <div className="text-[clamp(0.65rem,1.7dvh,0.78rem)] uppercase tracking-wider text-zinc-500">
                Maintenance
              </div>
              <button
                onClick={() => navigate('/science')}
                className="text-[clamp(0.68rem,1.75dvh,0.8rem)] text-zinc-500 hover:text-[#D4FF00]"
              >
                How? ›
              </button>
            </div>

            <div className="text-[clamp(1.5rem,4.5dvh,1.85rem)] font-bold tabular-nums text-white mb-1">
              {maintenance.maintenanceKcal} <span className="text-[clamp(0.72rem,1.9dvh,0.85rem)] text-zinc-500 font-medium">kcal</span>
            </div>
            <div className="text-[clamp(0.7rem,1.8dvh,0.82rem)] text-zinc-500 mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
              To sustain current weight
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 px-2 py-2 text-center">
                <div className="text-[clamp(0.6rem,1.55dvh,0.7rem)] uppercase tracking-wider text-zinc-500 mb-0.5">
                  Protein
                </div>
                <div className="text-[clamp(0.78rem,2dvh,0.95rem)] font-semibold text-white tabular-nums">
                  {maintenance.proteinG}<span className="text-zinc-500 text-[0.75em] ml-0.5">g</span>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 px-2 py-2 text-center">
                <div className="text-[clamp(0.6rem,1.55dvh,0.7rem)] uppercase tracking-wider text-zinc-500 mb-0.5">
                  Fat
                </div>
                <div className="text-[clamp(0.78rem,2dvh,0.95rem)] font-semibold text-white tabular-nums">
                  {maintenance.fatG}<span className="text-zinc-500 text-[0.75em] ml-0.5">g</span>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 px-2 py-2 text-center">
                <div className="text-[clamp(0.6rem,1.55dvh,0.7rem)] uppercase tracking-wider text-zinc-500 mb-0.5">
                  Carbs
                </div>
                <div className="text-[clamp(0.78rem,2dvh,0.95rem)] font-semibold text-white tabular-nums">
                  {maintenance.carbsG}<span className="text-zinc-500 text-[0.75em] ml-0.5">g</span>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* Card 2 — Projected Progress (NEW) */}
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]">
          <div className="flex items-center justify-between mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
            <div className="text-[clamp(0.65rem,1.7dvh,0.78rem)] uppercase tracking-wider text-zinc-500">
              Projected progress
            </div>
            <button
              onClick={() => navigate('/science')}
              className="text-[clamp(0.68rem,1.75dvh,0.8rem)] text-zinc-500 hover:text-[#D4FF00]"
            >
              How? ›
            </button>
          </div>

          {projection ? (
            <>
        <div className="text-[clamp(0.75rem,2dvh,0.9rem)] text-zinc-300 mb-[clamp(0.6rem,1.6dvh,0.9rem)] md:text-base">
                {projection.summary}
              </div>

              {/* Horizontal visual timeline */}
              <div className="relative">
                <div className="absolute top-3 left-2 right-2 h-[2px] bg-zinc-800 rounded-full" />
                <div
                  className="absolute top-3 left-2 h-[2px] bg-[#D4FF00] rounded-full transition-all"
                  style={{ width: `calc(${(100 * 12) / maxWeeks}% - 4px)` }}
                />

        <div className="relative grid grid-cols-4 gap-1 md:gap-4 md:py-2">
                  {markers.map((m, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]' : 'bg-zinc-600 border-2 border-zinc-900'} z-10`} />
                      <div className="mt-2 text-[clamp(0.6rem,1.55dvh,0.72rem)] uppercase tracking-wider text-zinc-500">
                        {m.label}
                      </div>
                      <div className="text-[clamp(0.72rem,1.85dvh,0.85rem)] font-semibold text-white tabular-nums">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {projection.rateCapped && (
                <div className="mt-[clamp(0.5rem,1.4dvh,0.75rem)] text-[clamp(0.65rem,1.65dvh,0.75rem)] text-amber-400/80 leading-snug">
                  Your {projection.weeklyChangeKg < 0 ? 'deficit' : 'surplus'} was capped at {projection.weeklyChangeKg < 0 ? '0.7%' : '0.35%'} of bodyweight per week to {projection.weeklyChangeKg < 0 ? 'preserve muscle' : 'keep the gain lean'}.
                </div>
              )}
            </>
          ) : (
            <div className="text-[clamp(0.75rem,2dvh,0.9rem)] text-zinc-500">
              Complete your plan to see projections.
            </div>
          )}
        </section>
{/* Card 3 — Your Details */}
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]">
          <div className="flex items-center justify-between mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
            <div className="text-[clamp(0.65rem,1.7dvh,0.78rem)] uppercase tracking-wider text-zinc-500">
              Your details
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-[clamp(0.68rem,1.75dvh,0.8rem)] text-[#D4FF00] hover:underline underline-offset-2"
            >
              Edit ›
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-[clamp(0.5rem,1.4dvh,0.75rem)]">
            {[
              { label: 'Height', value: profile?.height ? `${displayVal(profile.height)} cm` : '—' },
              { label: 'Age', value: displayVal(profile?.age) },
              { label: 'Activity', value: profile?.activity_level ?? '—' },
              { label: 'Diet', value: dietLabel },
            ].map((row) => (
              <div key={row.label} className="flex flex-col">
                <span className="text-[clamp(0.65rem,1.7dvh,0.75rem)] text-zinc-500">{row.label}</span>
                <span className="text-[clamp(0.8rem,2.1dvh,0.95rem)] font-medium text-white">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Card 4 — Subscription */}
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-[clamp(0.75rem,2dvh,1.25rem)]">
          <div className="text-[clamp(0.65rem,1.7dvh,0.78rem)] uppercase tracking-wider text-zinc-500 mb-[clamp(0.5rem,1.4dvh,0.75rem)]">
            Subscription
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[clamp(0.9rem,2.3dvh,1.05rem)] font-semibold text-white">
                {planLabel}
              </div>
              <div className="text-[clamp(0.7rem,1.8dvh,0.82rem)] text-zinc-500 mt-0.5">
                {planSubtitle}
              </div>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="text-[clamp(0.75rem,2dvh,0.9rem)] font-semibold text-[#D4FF00] hover:underline underline-offset-2"
            >
              See plans ›
            </button>
          </div>
        </section>
{/* Card 5 — Danger zone (Sign Out + dev crash preserved) */}
        <section className="flex flex-col gap-3 pt-[clamp(0.3rem,0.8dvh,0.5rem)] md:col-span-2">
          {import.meta.env.MODE === 'development' && (
            <button
              onClick={() => { throw new Error('Test Crash from LeanIQA!'); }}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] font-medium text-[15px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
            >
              <AlertTriangle size={18} />
              Test Crash Report
            </button>
          )}
          <button
            onClick={() => navigate('/about')}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] font-medium text-[15px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          >
            <img src="/logo.png" alt="LeanIQA" className="h-6 w-6 rounded-md" />
            About Us
          </button>
          <button
            onClick={() => authService.logout()}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] font-medium text-[15px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </section>

        {/* Card 6 — Reset */}
        <section className="mt-[clamp(1rem,2.6dvh,1.4rem)] md:col-span-2">
          <button
            onClick={() => setShowResetModal(true)}
        className="w-full text-center text-[clamp(0.72rem,1.85dvh,0.85rem)] text-red-500/80 hover:text-red-400 md:py-3"
          >
            Reset profile
          </button>
        </section>

      </div>
      </div>
    </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showResetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !resetMutation.isPending && setShowResetModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1A1A1C] border border-[rgba(255,255,255,0.06)] rounded-3xl p-6 w-full max-w-[340px] relative z-10 flex flex-col items-center text-center shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(255,77,28,0.1)] flex items-center justify-center mb-4">
                <AlertTriangle size={28} color="#FF4D1C" />
              </div>
              <h3 className="text-[24px] font-bold tracking-tight mb-2 text-white mb-2 tracking-tight">Reset Everything?</h3>
              <p className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed mb-6 leading-relaxed">
                This will delete your body stats and goals. Your logged meals and progress will remain, but you will need to complete onboarding again.
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                  className="btn-primary-style rounded-full w-full py-3.5 bg-[#FF3B30] text-white text-[18px] font-semibold tracking-tight disabled:opacity-50 transition-opacity hover:opacity-90"
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Yes, reset profile'}
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  disabled={resetMutation.isPending}
                  className="btn-ghost w-full py-3.5 text-[15px] font-medium"
                >
                  Keep my profile
                </button>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profileData={profile}
        goalData={goal}
      />

      <EditNutritionModal
        isOpen={showNutritionModal}
        onClose={() => setShowNutritionModal(false)}
        calculatedData={calculated}
        weightKg={profile?.weight ?? 0}
        goalType={goal?.goal_type ?? 'cut'}
        maintenanceKcal={Math.round(profile?.maintenance_kcal ?? 0)}
        currentCutPace={goal?.cut_pace ?? null}
      />
    </div>
  );
}
