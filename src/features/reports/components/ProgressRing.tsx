import { memo } from 'react';
import { computeRingGeometry } from '@/shared/utils/ringMath';
import { motion } from 'motion/react';

interface ProgressRingProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  showOverflowTip?: boolean;
  children?: React.ReactNode; // center content (number, icon, etc.)
}

export const ProgressRing = memo(function ProgressRing({
  current,
  goal,
  size = 120,
  strokeWidth = 12,
  color,
  trackColor = 'rgba(255,255,255,0.08)',
  showOverflowTip = true,
  children,
}: ProgressRingProps) {
  const geo = computeRingGeometry(current, goal, size, strokeWidth);
  const center = size / 2;

  // Overflow tip: a small bright dot at the 12 o'clock position showing the ring "lapped"
  const tipAngle = -90; // start position in degrees (top of circle)
  const tipRad = (tipAngle * Math.PI) / 180;
  const tipX = center + geo.radius * Math.cos(tipRad);
  const tipY = center + geo.radius * Math.sin(tipRad);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={geo.radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={geo.radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={geo.circumference}
          initial={{ strokeDashoffset: geo.circumference }}
          animate={{ strokeDashoffset: geo.dashOffset }}
          transition={{ type: 'spring', stiffness: 120, damping: 14, mass: 1 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
        {/* Overflow tip marker — distinct bright dot when goal exceeded */}
        {geo.isOverflow && showOverflowTip && (
          <motion.circle
            cx={tipX}
            cy={tipY}
            r={strokeWidth * 0.45}
            fill="#FFFFFF"
            stroke={color}
            strokeWidth={2}
            style={{ transform: `rotate(90deg)`, transformOrigin: `${center}px ${center}px` }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
});
