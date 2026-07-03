import { computeRingGeometry } from '@/shared/utils/ringMath';

export function MicroRing({ current, goal, size = 28, strokeWidth = 3, color }: { current: number; goal: number; size?: number; strokeWidth?: number; color: string }) {
  const geo = computeRingGeometry(current, goal, size, strokeWidth);
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={center} cy={center} r={geo.radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
      <circle
        cx={center}
        cy={center}
        r={geo.radius}
        fill="none"
        stroke={geo.percent > 0 ? color : 'rgba(255,255,255,0.1)'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={geo.circumference}
        strokeDashoffset={geo.dashOffset}
      />
    </svg>
  );
}
