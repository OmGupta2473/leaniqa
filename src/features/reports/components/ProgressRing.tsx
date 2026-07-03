import { computeRingGeometry } from '@/shared/utils/ringMath';

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

export function ProgressRing({
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
        <circle
          cx={center}
          cy={center}
          r={geo.radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={geo.circumference}
          strokeDashoffset={geo.dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
        {/* Overflow tip marker — distinct bright dot when goal exceeded */}
        {geo.isOverflow && showOverflowTip && (
          <circle
            cx={tipX}
            cy={tipY}
            r={strokeWidth * 0.45}
            fill="#FFFFFF"
            stroke={color}
            strokeWidth={2}
            style={{ transform: `rotate(90deg)`, transformOrigin: `${center}px ${center}px` }}
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
}
