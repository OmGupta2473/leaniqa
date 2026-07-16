import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { useState } from 'react';
import { ChevronLeft, LogOut, Trash2, AlertTriangle, User, Flame, Droplet, CheckCircle2 } from 'lucide-react';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '@/features/auth/services/authService';

function displayVal(val: any) {
  return val === undefined || val === null || isNaN(val) ? '—' : val;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });

  const { profileData: calculated } = useCalculatedProfile();

  const resetMutation = useMutation({
    mutationFn: async () => {
      await profileService.deleteGoal();
      await profileService.deleteProfile();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['goal'] });
      navigate('/onboarding/1');
    },
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      queryClient.clear();
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

  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
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
          <div className="bg-[rgba(255,255,255,0.06)] border-[0.5px] border-[rgba(255,255,255,0.1)] px-3 py-1 rounded-full text-[12px] font-medium text-[rgba(255,255,255,0.6)]">
            {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '—'}
          </div>
          <div className="bg-[rgba(255,255,255,0.06)] border-[0.5px] border-[rgba(255,255,255,0.1)] px-3 py-1 rounded-full text-[12px] font-medium text-[rgba(255,255,255,0.6)]">
            {displayVal(age)} yrs
          </div>
          <div className="bg-[rgba(255,255,255,0.06)] border-[0.5px] border-[rgba(255,255,255,0.1)] px-3 py-1 rounded-full text-[12px] font-medium text-[rgba(255,255,255,0.6)]">
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
              <div className="text-[16px] font-semibold text-white tracking-tight leading-tight">Personal Info</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.4)]">Body stats & activity</div>
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
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Weight</span>
            <span className="text-[14px] font-medium text-white">{displayVal(weightKg)} kg</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Height</span>
            <span className="text-[14px] font-medium text-white">{heightStr} cm <span className="text-[12px] text-[rgba(255,255,255,0.3)] ml-1">({heightSub})</span></span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Current BF</span>
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
              <div className="text-[16px] font-semibold text-white tracking-tight leading-tight">Body Goal</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.4)]">Target physique & strategy</div>
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
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Fat to lose</span>
            <span className="text-[14px] font-medium text-white">{displayVal(fatToLoseKg)} kg</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Target weight</span>
            <span className="text-[14px] font-medium text-white">{displayVal(targetWeightKg)} kg</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Strategy</span>
            <span className="text-[14px] font-medium text-[#D4FF00]">{displayVal(chosenStrategyName)}</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Daily deficit</span>
            <span className="text-[14px] font-medium text-white">{displayVal(dailyDeficit)} kcal</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Estimated time</span>
            <span className="text-[14px] font-medium text-white">{displayVal(estimatedWeeks)} weeks</span>
          </div>
          <div className="flex justify-between items-center py-3.5 px-4">
            <span className="text-[14px] text-[rgba(255,255,255,0.5)]">Target date</span>
            <span className="text-[14px] font-medium text-white">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Macros Section */}
      <div className="mb-12">
        <div className="text-[16px] font-semibold text-white tracking-tight mb-3">Daily Nutrition Targets</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Calories</div>
            <div className="text-[20px] font-bold text-[#D4FF00]">{displayVal(dailyCalorieGoal)}<span className="text-[12px] font-medium text-[rgba(212,255,0,0.5)] ml-1">kcal</span></div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Protein</div>
            <div className="text-[20px] font-bold text-[#FF4D1C]">{displayVal(proteinMin)}–{displayVal(proteinMax)}<span className="text-[12px] font-medium text-[rgba(255,77,28,0.5)] ml-1">g</span></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Carbs</div>
            <div className="text-[16px] font-bold text-white">{displayVal(carbMin)}–{displayVal(carbMax)}</div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Fat</div>
            <div className="text-[16px] font-bold text-white">{displayVal(fatMin)}–{displayVal(fatMax)}</div>
          </div>
          <div className="card-base p-4 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-1 font-semibold">Water</div>
            <div className="text-[16px] font-bold text-[#378ADD]">{displayVal(waterLitres)} L</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.7)] font-medium text-[15px] transition-colors hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] font-medium text-[15px] transition-colors hover:bg-[rgba(255,59,48,0.15)]"
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
              className="bg-[#1A1A1C] border border-[rgba(255,255,255,0.1)] rounded-3xl p-6 w-full max-w-[340px] relative z-10 flex flex-col items-center text-center shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(255,77,28,0.1)] flex items-center justify-center mb-4">
                <AlertTriangle size={28} color="#FF4D1C" />
              </div>
              <h3 className="text-[18px] font-bold text-white mb-2 tracking-tight">Reset Everything?</h3>
              <p className="text-[14px] text-[rgba(255,255,255,0.5)] mb-6 leading-relaxed">
                This will delete your body stats and goals. Your logged meals and progress will remain, but you will need to complete onboarding again.
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => resetMutation.mutate()} 
                  disabled={resetMutation.isPending}
                  className="btn-primary-style rounded-full w-full py-3.5 bg-[#FF3B30] text-white text-[15px] font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
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
