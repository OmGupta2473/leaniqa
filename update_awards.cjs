const fs = require('fs');

const content = `import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/features/reports/services/reportService";
import { calculateEarnedAwards, calculateBestDailyStreak, calculateCurrentDailyStreak, isDailyGoalMet, toUtcDay } from "@/shared/utils/streaks";
import { Flame, ChevronLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/shared/utils/utils";

export function AwardsPage() {
  const navigate = useNavigate();
  
  const { data: metrics = [] } = useQuery({ queryKey: ["dailyMetrics"], queryFn: () => reportService.getDailyMetrics() });
  const { data: dbUserStreak } = useQuery({ queryKey: ["userStreak"], queryFn: () => import('@/features/awards/services/awardService').then(m => m.awardService.getUserStreak()) });
  const { data: dbUserAwards = [] } = useQuery({ queryKey: ["userAwards"], queryFn: () => import('@/features/awards/services/awardService').then(m => m.awardService.getUserAwards()) });

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="page-enter pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(100px+env(safe-area-inset-bottom))] min-h-[100dvh] bg-[#0A0A0A] px-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate("/dashboard")} className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.1)]">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold text-white tracking-tight">Awards</h1>
        <div className="text-[13px] font-medium text-[rgba(255,255,255,0.5)]">
          {earnedCount}/{totalCount}
        </div>
      </div>

      {/* Current Streak Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(212,255,0,0.03)] border border-[rgba(212,255,0,0.15)] rounded-3xl p-8 flex flex-col items-center justify-center mb-10 text-center relative overflow-hidden">
        
        {todayMet && (
          <div className="absolute top-4 bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.2)] px-3 py-1 rounded-full text-[10px] font-semibold text-[#D4FF00] tracking-wide uppercase">
            Today's Streak Secured ✓
          </div>
        )}

        <div className="relative w-16 h-16 flex items-center justify-center mb-2 mt-4">
          <div className="absolute inset-0 bg-[#FF4D1C] rounded-full opacity-20 blur-md animate-pulse"></div>
          <div className="absolute inset-0 bg-[#FF4D1C] opacity-10 rounded-full animate-ping scale-150"></div>
          <Flame size={36} color="#FF4D1C" className="relative z-10" />
        </div>
        
        <div className="text-[56px] font-bold text-white tracking-[-2px] leading-none mb-1">{currentStreak}</div>
        <div className="text-[16px] text-[rgba(255,255,255,0.5)] font-medium">day streak</div>
        
        <div className="mt-6 text-[12px] text-[rgba(255,255,255,0.4)]">
          Personal best: <span className="text-white font-semibold">{bestStreak} days</span>
        </div>
      </motion.div>

      {/* Awards Grid */}
      <div className="mb-4">
        <h2 className="text-[18px] font-semibold text-white tracking-tight">Daily Streaks</h2>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-3 gap-3 sm:gap-4">
        {dailyAwards.map((award) => (
          <motion.div 
            key={award.id} 
            variants={itemVariants}
            onClick={() => setSelectedAward(award)}
            className={cn(
              "card-base p-4 flex flex-col items-center text-center cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-95",
              !award.earned && "opacity-40 grayscale-[60%]"
            )}
            style={{
              borderColor: award.earned ? \`\${award.primaryColor}66\` : undefined,
              boxShadow: award.earned ? \`0 0 20px \${award.primaryColor}20\` : undefined,
            }}
          >
            <div 
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[24px] mb-3 relative"
              style={{ backgroundColor: \`\${award.primaryColor}15\` }}
            >
              <span className="relative z-10" style={{ filter: award.earned ? 'none' : 'grayscale(100%) brightness(1.5)' }}>{award.symbol || award.symbolText || '🏆'}</span>
            </div>
            
            <div className="text-[12px] font-semibold text-white leading-tight mb-1">{award.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.4)] mb-2">{award.streakRequired} Days</div>
            
            {award.earned && (
              <div className="bg-[rgba(212,255,0,0.15)] text-[#D4FF00] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Earned</div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Overlay */}
      <AnimatePresence>
        {selectedAward && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedAward(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: [1, 1.05, 1], y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-[#111113] border border-[rgba(255,255,255,0.1)] rounded-[32px] p-8 max-w-sm w-full flex flex-col items-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: selectedAward.earned ? \`0 20px 60px \${selectedAward.primaryColor}30\` : '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* Confetti effect if earned */}
              {selectedAward.earned && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedAward.primaryColor }}
                      initial={{ top: '30%', left: '50%', opacity: 1, scale: 0 }}
                      animate={{ 
                        top: \`\${20 + Math.random() * 40}%\`, 
                        left: \`\${10 + Math.random() * 80}%\`,
                        opacity: 0,
                        scale: Math.random() * 1.5 + 0.5
                      }}
                      transition={{ duration: 1 + Math.random(), ease: "easeOut" }}
                    />
                  ))}
                </>
              )}

              <button 
                onClick={() => setSelectedAward(null)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div 
                className="w-[100px] h-[100px] rounded-full flex items-center justify-center text-[48px] mb-6 relative"
                style={{ 
                  backgroundColor: \`\${selectedAward.primaryColor}15\`,
                  boxShadow: selectedAward.earned ? \`0 0 30px \${selectedAward.primaryColor}40\` : undefined 
                }}
              >
                <span style={{ filter: selectedAward.earned ? 'none' : 'grayscale(100%) brightness(1.5)' }}>
                  {selectedAward.symbol || selectedAward.symbolText || '🏆'}
                </span>
              </div>
              
              <div className="text-[24px] font-bold text-white text-center mb-2">{selectedAward.name}</div>
              <div className="text-[14px] text-[rgba(255,255,255,0.6)] text-center mb-8 px-4 leading-relaxed">
                {selectedAward.description}
              </div>

              {selectedAward.earned ? (
                <div className="w-full bg-[rgba(212,255,0,0.1)] border border-[rgba(212,255,0,0.2)] rounded-2xl py-4 flex flex-col items-center">
                  <div className="text-[12px] uppercase tracking-widest font-semibold text-[#D4FF00] mb-1">Status</div>
                  <div className="text-[16px] font-bold text-white">Unlocked</div>
                </div>
              ) : (
                <div className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-[12px] font-medium text-[rgba(255,255,255,0.6)]">Progress</div>
                    <div className="text-[14px] font-bold text-white">{currentStreak} <span className="text-[12px] font-normal text-[rgba(255,255,255,0.4)]">/ {selectedAward.streakRequired}</span></div>
                  </div>
                  <div className="w-full h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: \`\${Math.min(100, (currentStreak / selectedAward.streakRequired) * 100)}%\`,
                        backgroundColor: selectedAward.primaryColor || '#D4FF00'
                      }}
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
`
fs.writeFileSync('src/features/awards/pages/AwardsPage.tsx', content);
