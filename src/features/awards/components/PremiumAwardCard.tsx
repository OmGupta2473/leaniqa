import { motion } from 'motion/react';
import { MicroRing } from '@/features/reports/components/MicroRing';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';

interface PremiumAwardCardProps {
  award: {
    id: string;
    name: string;
    symbol: string;
    primaryColor: string;
    accentColor: string;
    category: string;
    target: number;
    unitLabel: string;
    earned: boolean;
    currentStreak: number;
    streakRequired: number;
    isNew?: boolean;
  };
  onClick: () => void;
}

/**
 * Premium collectible card for a single award.
 *
 * - Unlocked: holographic gradient border, glow, colored icon well
 * - Locked:  matte dark, dimmed icon, muted ring
 * - New (acknowledged in the last 7 days): subtle pulse badge
 */
export function PremiumAwardCard({ award, onClick }: PremiumAwardCardProps) {
  const isUnlocked = award.earned;

  const handleClick = () => {
    if (isUnlocked) haptics.success();
    else haptics.tap();
    onClick();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-[24px] p-4 text-center',
        'border',
      )}
      style={
        isUnlocked
          ? {
              background: `linear-gradient(150deg, ${award.primaryColor}14 0%, rgba(15,15,17,0.95) 60%)`,
              borderColor: `${award.primaryColor}45`,
              boxShadow: `0 12px 36px -12px ${award.primaryColor}30, inset 0 1px 0 ${award.primaryColor}20`,
            }
          : {
              background: 'rgba(255,255,255,0.015)',
              borderColor: 'rgba(255,255,255,0.05)',
            }
      }
      aria-label={`${award.name}, ${isUnlocked ? 'unlocked' : 'locked'}`}
    >
      {isUnlocked && (
        <>
          <div
            className="pointer-events-none absolute -inset-8 opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
            style={{ background: `radial-gradient(circle, ${award.primaryColor}, transparent 70%)` }}
          />
          <div
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${award.primaryColor}80, transparent)`,
            }}
          />
        </>
      )}

      {award.isNew && isUnlocked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
          className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            background: `${award.primaryColor}20`,
            color: award.primaryColor,
            border: `1px solid ${award.primaryColor}40`,
          }}
        >
          New
        </motion.div>
      )}

      <div className="absolute top-3 left-3 z-10">
        <MicroRing
          current={award.currentStreak}
          goal={award.streakRequired}
          size={26}
          strokeWidth={2.5}
          color={isUnlocked ? award.primaryColor : 'rgba(255,255,255,0.35)'}
        />
      </div>

      <div
        className={cn(
          'relative z-10 mb-3 flex h-16 w-16 items-center justify-center rounded-[20px] text-[34px] transition-transform duration-500',
          isUnlocked ? 'group-hover:scale-110' : 'opacity-55',
        )}
        style={
          isUnlocked
            ? {
                background: `linear-gradient(135deg, ${award.primaryColor}22, ${award.primaryColor}04)`,
                border: `1px solid ${award.primaryColor}35`,
                filter: `drop-shadow(0 6px 16px ${award.primaryColor}35)`,
              }
            : {
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }
        }
      >
        <span className="drop-shadow-lg">{award.symbol}</span>
      </div>

      <div className="relative z-10 w-full px-1">
        <div
          className={cn(
            'text-[12.5px] font-bold leading-tight tracking-tight',
            isUnlocked ? 'text-white' : 'text-zinc-500',
          )}
        >
          {award.name}
        </div>
        <div
          className={cn(
            'mt-1 text-[10px] font-medium uppercase tracking-wider',
            isUnlocked ? 'text-zinc-400' : 'text-zinc-600',
          )}
        >
          {award.target} {award.unitLabel}
        </div>
      </div>
    </motion.button>
  );
}