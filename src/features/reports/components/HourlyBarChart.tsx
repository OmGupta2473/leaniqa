import { memo } from 'react';
import { motion } from 'motion/react';
import { springSettle } from './motion';

interface HourlyBarChartProps {
  hourlyValues: number[]; // length 24
  color: string;
  height?: number;
}

export const HourlyBarChart = memo(function HourlyBarChart({ hourlyValues, color, height = 80 }: HourlyBarChartProps) {
  const safeValues = hourlyValues.length === 24 ? hourlyValues : Array(24).fill(0);
  const maxVal = Math.max(...safeValues, 1); // auto-scaling ceiling based on day's max

  // Create SVG gradient ID
  const gradientId = `bar-gradient-${color.replace('#', '')}`;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height, gap: '2px', width: '100%', position: 'relative' }}>
      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.3} />
          </linearGradient>
        </defs>
      </svg>
      {safeValues.map((val, hour) => {
        const barHeightPct = (val / maxVal) * 100;
        const isCurrentHour = hour === new Date().getHours();
        return (
          <div
            key={hour}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              position: 'relative'
            }}
            title={`${hour}:00 — ${Math.round(val)} kcal`}
          >
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: Math.max(barHeightPct, val > 0 ? 4 : 0) / 100 }}
              transition={{ ...springSettle, delay: hour * 0.02 }}
              style={{
                width: '100%',
                height: '100%',
                background: `url(#${gradientId})`,
                backgroundColor: isCurrentHour ? color : undefined,
                backgroundImage: isCurrentHour ? 'none' : `linear-gradient(to bottom, ${color}, ${color}40)`,
                borderRadius: '3px 3px 0 0',
                transformOrigin: 'bottom',
                willChange: 'transform',
                filter: isCurrentHour ? `drop-shadow(0 0 6px ${color}80)` : 'none',
              }}
            />
            {isCurrentHour && (
               <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: color,
                  borderRadius: '3px 3px 0 0',
                  pointerEvents: 'none'
                }}
               />
            )}
          </div>
        );
      })}
    </div>
  );
});
