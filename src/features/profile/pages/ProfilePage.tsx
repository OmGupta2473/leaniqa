import { useChatStore } from '@/app/store';
import { useUserStore } from '@/features/profile/store/userStore';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { useState } from 'react';
import { ChevronLeft, LogOut, Trash2, AlertTriangle, User, Flame, Droplet, CheckCircle2, Crown, CreditCard as CreditCardIcon, Sparkles, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '@/features/auth/services/authService';
import { haptics } from '@/shared/utils/haptics';
import { subscriptionService } from '@/features/pricing/services/subscriptionService';
import { TransformationSection } from '@/features/transformation/components/TransformationSection';
import { analytics } from '@/shared/utils/analytics';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { ProfileSkeleton } from '@/shared/components/Skeletons';
import { useToast } from '@/shared/components/Toast';

function displayVal(val: any) {
  return val === undefined || val === null || isNaN(val) ? '—' : val;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const isOnline = useNetworkConnectivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });

  const { profileData: calculated } = useCalculatedProfile();
  const { data: subscription, isLoading: isSubLoading } = useQuery({ 
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      queryClient.clear();
      haptics.success();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const {
    name, gender, age, activityLevel,
    weightKg, heightCm, currentBodyFatPct, targetBodyFatPct,
    tdee, proteinMin, proteinMax, fatMin, fatMax, carbMin, carbMax, fiberMin, fiberMax, waterLitres,
    fatToLoseKg, targetWeightKg, chosenStrategyName, dailyCalorieGoal, dailyDeficit, estimatedWeeks, estimatedCompletionDate
  } = calculated;

  let heightStr = '—';
  let heightSub = '';
  if (heightCm) {
    heightStr = String(heightCm);
    const feet = Math.floor(heightCm / 30.48);
    const inches = Math.round((heightCm / 2.54) % 12);
    heightSub = `${feet}'${inches}"`;
  }

  let dateStr = '—';
  if (estimatedCompletionDate) {
    const d = new Date(estimatedCompletionDate);
    if (!isNaN(d.getTime())) {
      dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      dateStr = estimatedCompletionDate as string;
    }
  }

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
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" className="w-[44px] h-[44px] rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="text-[17px] font-semibold text-white tracking-tight">Profile</div>
        <div className="w-8" />
      </div>

      {/* Avatar & Basic Info */}
      <div className="flex flex-col items-center mb-10">
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

      {/* Step 1: Personal Info */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(212,255,0,0.1)] border-[0.5px] border-[rgba(212,255,0,0.2)] flex items-center justify-center">
              <span className="text-[#D4FF00] font-extrabold text-[16px]">1</span>
            </div>
            <div>
              <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight leading-tight">Personal Info</div>
              <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Body stats & activity</div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/onboarding/1')} 
            className="btn-ghost"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Edit
          </button>
        </div>

        <div className="card-base p-0 overflow-hidden">
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Weight</span>
            <span className="text-[14px] font-medium text-white">{displayVal(weightKg)} kg</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Height</span>
            <span className="text-[14px] font-medium text-white">{heightStr} cm <span className="text-[12px] text-[rgba(255,255,255,0.3)] ml-1">({heightSub})</span></span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Current BF</span>
            <span className="text-[14px] font-medium text-white">{displayVal(currentBodyFatPct)}%</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 bg-[rgba(212,255,0,0.02)]">
            <span className="text-[14px] text-[rgba(212,255,0,0.5)]">Target BF</span>
            <span className="text-[14px] font-bold text-[#D4FF00]">{displayVal(targetBodyFatPct)}%</span>
          </div>
        </div>
      </div>

      {/* Step 2: Body Goal */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(55,138,221,0.1)] border-[0.5px] border-[rgba(55,138,221,0.2)] flex items-center justify-center">
              <span className="text-[#378ADD] font-extrabold text-[16px]">2</span>
            </div>
            <div>
              <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight leading-tight">Body Goal</div>
              <div className="text-[13px] text-[rgba(235,235,245,0.5)]">Target physique & strategy</div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/goal')} 
            className="bg-[rgba(55,138,221,0.12)] border-[0.5px] border-[rgba(55,138,221,0.3)] rounded-lg text-[#378ADD] font-semibold"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Update
          </button>
        </div>

        <div className="card-base p-0 overflow-hidden mb-4">
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Fat to lose</span>
            <span className="text-[14px] font-medium text-white">{displayVal(fatToLoseKg)} kg</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Target weight</span>
            <span className="text-[14px] font-medium text-white">{displayVal(targetWeightKg)} kg</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Strategy</span>
            <span className="text-[14px] font-medium text-[#D4FF00]">{displayVal(chosenStrategyName)}</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Daily deficit</span>
            <span className="text-[14px] font-medium text-white">{displayVal(dailyDeficit)} kcal</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Estimated time</span>
            <span className="text-[14px] font-medium text-white">{displayVal(estimatedWeeks)} weeks</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4">
            <span className="text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">Target date</span>
            <span className="text-[14px] font-medium text-white">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Transformation Section */}
      <TransformationSection />

      {/* Macros Section */}
      <div className="mb-12">
        <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight mb-3">Daily Nutrition Targets</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Calories</div>
            <div className="text-[20px] font-bold text-[#D4FF00]">{displayVal(dailyCalorieGoal)}<span className="text-[12px] font-medium text-[rgba(212,255,0,0.5)] ml-1">kcal</span></div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Protein</div>
            <div className="text-[20px] font-bold text-[#FF4D1C]">{displayVal(proteinMin)}–{displayVal(proteinMax)}<span className="text-[12px] font-medium text-[rgba(255,77,28,0.5)] ml-1">g</span></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Carbs</div>
            <div className="text-[16px] font-bold text-white">{displayVal(carbMin)}–{displayVal(carbMax)}</div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Fat</div>
            <div className="text-[16px] font-bold text-white">{displayVal(fatMin)}–{displayVal(fatMax)}</div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Water</div>
            <div className="text-[16px] font-bold text-[#378ADD]">{displayVal(waterLitres)} L</div>
          </div>
        </div>
      </div>

      
      {/* Subscription & Plans */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[22px] font-semibold tracking-tight text-white tracking-tight leading-tight">Plan & Billing</div>
        </div>
        
        {isSubLoading ? (
          <div className="h-40 rounded-3xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] animate-pulse" />
        ) : subscription?.isPremium ? (
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-[rgba(212,255,0,0.08)] to-[rgba(212,255,0,0.02)] border-[1.5px] border-[rgba(212,255,0,0.2)] rounded-3xl p-6 flex flex-col relative overflow-hidden backdrop-blur-xl shadow-[0_8px_32px_rgba(212,255,0,0.05)]"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#D4FF00] opacity-[0.07] blur-3xl rounded-full" />
            <div className="absolute top-4 right-4 text-[rgba(212,255,0,0.4)]">
              <Crown size={48} strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-[#D4FF00] text-black px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_2px_8px_rgba(212,255,0,0.4)]">
                <Crown size={12} strokeWidth={2.5} /> PRO ACTIVE
              </div>
            </div>
            
            <div className="text-[22px] font-bold text-white tracking-tight mb-1 relative z-10">
              LeanIQA Premium
            </div>
            <div className="text-[13px] text-[rgba(255,255,255,0.6)] mb-6 flex items-center gap-1.5 relative z-10">
               <Zap size={14} className="text-[#D4FF00]" /> Yearly Billing Cycle
            </div>

            <button 
              onClick={() => {
                haptics.tap();
                navigate('/pricing');
              }}
              className="flex items-center justify-between w-full p-4 rounded-[24px] bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(212,255,0,0.3)] transition-all duration-300 group relative z-10 backdrop-blur-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[rgba(212,255,0,0.1)] flex items-center justify-center border border-[rgba(212,255,0,0.2)]">
                  <CreditCardIcon size={18} className="text-[#D4FF00]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[18px] font-semibold tracking-tight text-white leading-tight">Manage Subscription</span>
                  <span className="text-[13px] text-[rgba(235,235,245,0.5)] mt-0.5">View plan, billing, restore</span>
                </div>
              </div>
              <ArrowRight size={18} className="text-[rgba(255,255,255,0.4)] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
            <button 
              onClick={() => {
                toast({
                  type: 'warning',
                  message: 'Cancel your subscription?',
                  duration: 8000,
                  action: {
                    label: 'Yes, cancel',
                    onClick: () => {
                      subscriptionService.cancelSubscription();
                      analytics.trackEvent('Subscription Cancelled');
                      toast({ type: 'info', message: 'Subscription cancelled.' });
                    }
                  }
                });
              }}
              className="mt-2 flex items-center justify-center w-full p-3 rounded-[24px] text-[14px] text-[rgba(255,255,255,0.5)] hover:text-red-400 hover:bg-[rgba(255,77,28,0.1)] transition-colors"
            >
              Cancel Subscription
            </button>
          </motion.div>
        ) : (
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              haptics.tap();
              navigate('/pricing');
            }}
            className="cursor-pointer bg-gradient-to-b from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(212,255,0,0.4)] rounded-3xl p-6 flex flex-col relative overflow-hidden backdrop-blur-xl transition-all duration-300 group shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white opacity-[0.03] group-hover:bg-[#D4FF00] group-hover:opacity-[0.05] transition-colors duration-500 blur-3xl rounded-full" />
            <div className="absolute top-4 right-4 text-[rgba(255,255,255,0.1)] group-hover:text-[rgba(212,255,0,0.2)] transition-colors duration-500">
              <Crown size={48} strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-[rgba(255,255,255,0.15)] text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 backdrop-blur-md border border-[rgba(255,255,255,0.06)]">
                FREE PLAN
              </div>
            </div>
            
            <div className="text-[22px] font-bold text-white tracking-tight mb-2 relative z-10">
              Upgrade to Pro
            </div>
            
            <ul className="flex flex-col gap-2.5 mb-6 relative z-10">
              <li className="flex items-start gap-2.5 text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">
                <Sparkles size={16} className="text-[#D4FF00] shrink-0 mt-[1px]" />
                <span>Advanced AI Weekly Reports</span>
              </li>
              <li className="flex items-start gap-2.5 text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed">
                <Sparkles size={16} className="text-[#D4FF00] shrink-0 mt-[1px]" />
                <span>Physique timeline projections</span>
              </li>
            </ul>

            <button 
              className="flex items-center justify-center gap-2 w-full py-4 rounded-[20px] bg-white text-black font-semibold text-[15px] group-hover:bg-[#D4FF00] transition-colors duration-300 relative z-10 shadow-[0_4px_12px_rgba(255,255,255,0.15)] group-hover:shadow-[0_4px_16px_rgba(212,255,0,0.3)]"
            >
              <Crown size={18} strokeWidth={2.5} />
              View Plans
            </button>
          </motion.div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="flex flex-col gap-4">
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
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] font-medium text-[15px] transition-colors hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <>
              <div className="w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut size={18} />
              Sign Out
            </>
          )}
        </button>
        <button 
          onClick={() => setShowResetModal(true)} 
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[24px] bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] font-medium text-[15px] transition-colors hover:bg-[rgba(255,59,48,0.15)]"
        >
          <Trash2 size={18} />
          Reset Profile
        </button>
      </div>

      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
      </AnimatePresence>
    </div>
  );
}
