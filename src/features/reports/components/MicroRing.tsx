import { memo } from 'react';
import { computeRingGeometry } from '@/shared/utils/ringMath';
import { motion } from 'motion/react';

export const MicroRing = memo(function MicroRing({ current, goal, size = 28, strokeWidth = 3, color }: { current: number; goal: number; size?: number; strokeWidth?: number; color: string }) {
  const geo = computeRingGeometry(current, goal, size, strokeWidth);
  const center = size / 2;
  return (
    <motion.svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <circle cx={center} cy={center} r={geo.radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={center}
        cy={center}
        r={geo.radius}
        fill="none"
        stroke={geo.percent > 0 ? color : 'rgba(255,255,255,0.1)'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={geo.circumference}
        initial={{ strokeDashoffset: geo.circumference }}
        animate={{ strokeDashoffset: geo.dashOffset }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      />
    </motion.svg>
  );
});
