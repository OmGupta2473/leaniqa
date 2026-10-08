import { CATEGORY_COLORS, type AwardCategory } from '../theme';

interface AwardMedalProps {
  category: AwardCategory;
  symbol: string;
  current: number;
  target: number;
  unlocked: boolean;
  size: number;
}

export function AwardMedal({
  category,
  symbol,
  current,
  target,
  unlocked,
  size,
}: AwardMedalProps) {
  const color = CATEGORY_COLORS[category];
  const circumference = 2 * Math.PI * 46;
  const progress = unlocked ? 1 : Math.min(1, Math.max(0, current / target));
  const dashOffset = circumference * (1 - progress);
  const faceFill = unlocked ? color : '#2a2a2d';
  const faceGradientId = `medal-face-${category}-${unlocked ? 'unlocked' : 'locked'}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={unlocked ? 'Award unlocked' : 'Award locked'}
    >
      <defs>
        <radialGradient id={faceGradientId} cx="35%" cy="30%" r="85%">
          <stop
            offset="0%"
            stopColor={unlocked ? '#FFFFFF' : '#000000'}
            stopOpacity={unlocked ? 0.4 : 0.15}
          />
          <stop offset="55%" stopColor={color} stopOpacity="0" />
          <stop
            offset="100%"
            stopColor="#000000"
            stopOpacity={unlocked ? 0.3 : 0.5}
          />
        </radialGradient>
        <linearGradient id={`medal-foil-${category}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0)" />
          <stop offset="48%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="52%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="4"
      />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 50 50)"
      />
      <circle cx="50" cy="50" r="40" fill={faceFill} />
      <circle cx="50" cy="50" r="40" fill={`url(#${faceGradientId})`} />
      <circle
        cx="50"
        cy="50"
        r="41"
        fill="none"
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill={`url(#medal-foil-${category})`}
        style={{
          opacity: category === 'milestone' && unlocked ? 1 : 0,
          transition: 'opacity 400ms ease',
        }}
      />
      {unlocked && (
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeDasharray="38 251"
          transform="rotate(-135 50 50)"
        />
      )}
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.35}
        fill="rgba(0,0,0,0.35)"
      >
        {symbol}
      </text>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.35}
      >
        {symbol}
      </text>
    </svg>
  );
}