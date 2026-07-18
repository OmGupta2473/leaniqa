import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/features/reports/services/reportService";
import { 
  calculateEarnedAwards, 
  calculateBestDailyStreak, 
  calculateCurrentDailyStreak, 
  isDailyGoalMet, 
  toUtcDay 
} from "@/shared/utils/streaks";
import { Flame, ChevronLeft, X, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/shared/utils/utils";
import { haptics } from '@/shared/utils/haptics';

const SPRING_TRANSITION: any = { type: 'spring' as const, stiffness: 400, damping: 30 };
const SMOOTH_TRANSITION: any = { duration: 0.4, ease: [0.16, 1, 0.3, 1] };

export function AwardsPage() {
  const navigate = useNavigate();
  
  const { data: metrics = [] } = useQuery({ 
    queryKey: ["dailyMetrics"], 
    queryFn: () => reportService.getDailyMetrics() 
  });
  
  const { data: dbUserStreak } = useQuery({ 
    queryKey: ["userStreak"], 
    queryFn: () => import('@/features/awards/services/awardService').then(m => m.awardService.getUserStreak()) 
  });
  
  const { data: dbUserAwards = [] } = useQuery({ 
    queryKey: ["userAwards"], 
    queryFn: () => import('@/features/awards/services/awardService').then(m => m.awardService.getUserAwards()) 
  });

  const currentStreak = dbUserStreak?.current_streak ?? calculateCurrentDailyStreak(metrics);
  const bestStreak = dbUserStreak?.highest_streak ?? calculateBestDailyStreak(metrics);

  const todayMetric = metrics.find(m => toUtcDay(m.date) === toUtcDay(new Date()));
  const todayMet = todayMetric ? isDailyGoalMet(todayMetric) : false;

  const earnedAwards = calculateEarnedAwards(metrics).map(award => {
    const dbAward = dbUserAwards.find(a => a.award_id === award.id);
    return {
      ...award,
      earned: !!dbAward || award.earned,
      earnedDate: dbAward?.unlocked_at || award.earnedDate
    };
  });

  const [selectedAward, setSelectedAward] = useState<any>(null);

  const dailyAwards = earnedAwards.filter((a) => a.category === "daily");
  const earnedCount = dailyAwards.filter((a) => a.earned).length;
  const totalCount = dailyAwards.length;

  const nextAward = [...dailyAwards].sort((a, b) => a.streakRequired - b.streakRequired).find(a => !a.earned);
  const nextTarget = nextAward ? nextAward.streakRequired : (bestStreak > currentStreak ? bestStreak + 1 : currentStreak + 10);
  const progressPercent = Math.min(100, (currentStreak / nextTarget) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, scale: 0.9, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: SPRING_TRANSITION }
  };

  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#000000] px-5 overflow-x-hidden selection:bg-[#D4FF00] selection:text-black">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={SMOOTH_TRANSITION}
        className="flex items-center justify-between mb-10 sticky top-[env(safe-area-inset-top)] z-30"
      >
        <button 
          onClick={() => navigate("/dashboard")} 
          className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.08)] backdrop-blur-xl flex items-center justify-center transition-all hover:bg-[rgba(255,255,255,0.15)] active:scale-95 border border-[rgba(255,255,255,0.05)]"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold text-white tracking-tight">Awards</h1>
        <div className="text-[13px] font-medium text-[rgba(255,255,255,0.6)] bg-[rgba(255,255,255,0.06)] px-3 py-1 rounded-full border border-[rgba(255,255,255,0.04)] backdrop-blur-md">
          {earnedCount} <span className="opacity-50">/ {totalCount}</span>
        </div>
      </motion.div>

      {/* Premium Hero Streak Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
        className="relative rounded-[32px] p-8 flex flex-col items-center justify-center mb-10 text-center overflow-hidden border border-[rgba(255,255,255,0.05)]"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,22,1) 0%, rgba(10,10,12,1) 100%)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* Animated Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-[#FF4D1C] rounded-full blur-[80px] opacity-[0.15] animate-pulse" />
        
        {todayMet && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-5 bg-[rgba(212,255,0,0.15)] border border-[rgba(212,255,0,0.3)] px-3 py-1.5 rounded-full text-[10px] font-bold text-[#D4FF00] tracking-widest uppercase backdrop-blur-md shadow-[0_0_15px_rgba(212,255,0,0.1)]"
          >
            Today's Streak Secured ✓
          </motion.div>
        )}

        {/* Animated Progress Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-4 mt-6">
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Ring */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            {/* Foreground Ring */}
            <motion.circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="url(#streakGradient)" 
              strokeWidth="6" 
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              strokeDasharray={circumference}
            />
            <defs>
              <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4D1C" />
                <stop offset="100%" stopColor="#FF8B1C" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative">
              <Flame size={40} color="#FF4D1C" className="relative z-10 drop-shadow-[0_0_10px_rgba(255,77,28,0.5)]" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
          className="text-[64px] font-bold text-white tracking-tighter leading-none mb-1 drop-shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
        >
          {currentStreak}
        </motion.div>
        <div className="text-[15px] text-[rgba(255,255,255,0.5)] font-medium tracking-wide uppercase">Day Streak</div>
        
        <div className="mt-8 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[24px] px-5 py-3 flex items-center gap-3">
          <Trophy size={16} className="text-[#D4FF00] opacity-80" />
          <div className="text-[13px] text-[rgba(255,255,255,0.6)]">
            Personal best: <span className="text-white font-bold ml-1">{bestStreak} days</span>
          </div>
        </div>
      </motion.div>

      {/* Awards Grid Section */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-semibold text-white tracking-tight">Milestones</h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent ml-4"></div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {dailyAwards.map((award) => (
          <motion.div 
            key={award.id} 
            variants={itemVariants}
            onClick={() => {
              if (award.earned) haptics.success();
              else haptics.tap();
              setSelectedAward(award);
            }}
            className={cn(
              "relative rounded-[24px] p-5 flex flex-col items-center text-center cursor-pointer transition-all duration-300",
              "hover:scale-[1.03] active:scale-[0.97]",
              award.earned 
                ? "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] shadow-lg" 
                : "bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] opacity-60 grayscale-[80%]"
            )}
            style={award.earned ? {
              boxShadow: `0 10px 30px ${award.primaryColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
              border: `1px solid ${award.primaryColor}40`
            } : {}}
          >
            {/* Ambient background glow for earned awards */}
            {award.earned && (
              <div 
                className="absolute inset-0 rounded-[24px] opacity-20 blur-xl pointer-events-none"
                style={{ background: award.primaryColor }}
              />
            )}
            
            <div 
              className="w-16 h-16 rounded-[18px] flex items-center justify-center text-[34px] mb-4 relative z-10 transition-transform duration-500"
              style={{ 
                background: award.earned 
                  ? `linear-gradient(135deg, ${award.primaryColor}20, ${award.primaryColor}05)` 
                  : 'rgba(255,255,255,0.05)',
                border: award.earned ? `1px solid ${award.primaryColor}30` : '1px solid rgba(255,255,255,0.05)',
                filter: award.earned ? 'none' : 'brightness(0.7)' 
              }}
            >
              <span className="relative z-10 drop-shadow-lg">{award.symbol || award.symbolText || '🏆'}</span>
            </div>
            
            <div className="text-[14px] font-bold text-white leading-tight mb-1 tracking-tight relative z-10">{award.name}</div>
            <div className="text-[12px] uppercase tracking-[0.05em] font-medium text-[rgba(255,255,255,0.5)] font-medium mb-3 relative z-10">{award.streakRequired} Days</div>
            
            {award.earned && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-[24px] opacity-70"
                style={{ background: `linear-gradient(90deg, transparent, ${award.primaryColor}, transparent)` }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Immersive Modal Overlay */}
      <AnimatePresence>
        {selectedAward && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }} 
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60"
            onClick={() => {
              haptics.tap();
              setSelectedAward(null);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[rgba(20,20,22,0.95)] border border-[rgba(255,255,255,0.12)] rounded-[40px] p-8 max-w-sm w-full flex flex-col items-center relative overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: selectedAward.earned 
                  ? `0 30px 80px ${selectedAward.primaryColor}25, inset 0 1px 0 rgba(255,255,255,0.15)` 
                  : '0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Premium Inner Glow */}
              <div 
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
                style={{ backgroundColor: selectedAward.primaryColor || '#ffffff' }}
              />

              {/* Enhanced Confetti / Particles */}
              {selectedAward.earned && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: selectedAward.primaryColor, boxShadow: `0 0 10px ${selectedAward.primaryColor}` }}
                      initial={{ top: '50%', left: '50%', opacity: 1, scale: 0 }}
                      animate={{ 
                         top: `${10 + Math.random() * 80}%`, 
                         left: `${10 + Math.random() * 80}%`,
                        opacity: [0, 1, 0],
                        scale: Math.random() * 2 + 0.5
                      }}
                      transition={{ duration: 1.5 + Math.random(), ease: "easeOut", repeat: Infinity, repeatDelay: Math.random() }}
                    />
                  ))}
                </>
              )}

              <button 
                onClick={() => {
              haptics.tap();
              setSelectedAward(null);
            }}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.15)] transition-all active:scale-90 z-20"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-32 h-32 rounded-[32px] flex items-center justify-center text-[64px] mb-10 relative z-10"
                style={{ 
                  background: `linear-gradient(135deg, ${selectedAward.primaryColor}25, ${selectedAward.primaryColor}05)`,
                  border: `1px solid ${selectedAward.primaryColor}40`,
                  boxShadow: selectedAward.earned ? `0 0 40px ${selectedAward.primaryColor}30` : undefined,
                  filter: selectedAward.earned ? 'none' : 'grayscale(100%) brightness(1.2)'
                }}
              >
                <span className="relative z-10 drop-shadow-2xl">
                  {selectedAward.symbol || selectedAward.symbolText || '🏆'}
                </span>
              </motion.div>
              
              <h3 className="text-[28px] font-bold text-white text-center mb-3 tracking-tight relative z-10">{selectedAward.name}</h3>
              <p className="text-[15px] text-[rgba(255,255,255,0.6)] text-center mb-10 px-2 leading-relaxed font-medium relative z-10">
                {selectedAward.description}
              </p>

              {selectedAward.earned ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[20px] py-4 flex flex-col items-center shadow-inner relative z-10"
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[rgba(255,255,255,0.5)] mb-1">Status</div>
                  <div 
                    className="text-[18px] font-bold bg-clip-text text-transparent"
                    style={{ backgroundImage: `linear-gradient(90deg, #fff, ${selectedAward.primaryColor})` }}
                  >
                    Unlocked
                  </div>
                </motion.div>
              ) : (
                <div className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-5 relative z-10">
                  <div className="flex justify-between items-end mb-3">
                    <div className="text-[12px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Progress</div>
                    <div className="text-[18px] font-semibold tracking-tight text-white">
                      {currentStreak} <span className="text-[13px] font-medium text-[rgba(255,255,255,0.4)]">/ {selectedAward.streakRequired}</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (currentStreak / selectedAward.streakRequired) * 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: selectedAward.primaryColor || '#ffffff' }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
