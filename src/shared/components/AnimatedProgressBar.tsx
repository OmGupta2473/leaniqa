import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/shared/utils/utils';

export interface AnimatedProgressBarProps {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number | string;
  className?: string;
  delay?: number;
  label?: React.ReactNode;
  gradient?: boolean;
}

export function AnimatedProgressBar({
  value,
  color,
  trackColor = "rgba(255,255,255,0.1)",
  height = 6,
  className,
  delay = 0,
  label,
  gradient
}: AnimatedProgressBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeProgress = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {label && <div className="mb-[4px]">{label}</div>}
      <div 
        className="w-full rounded-full overflow-hidden" 
        style={{ height, background: trackColor }}
      >
        <motion.div
          className={cn(
            "h-full w-full rounded-full origin-left",
            gradient ? "bg-gradient-to-r from-[#D4FF00] to-[#A8CC00]" : ""
          )}
          style={{ 
            background: !gradient ? (color || "#D4FF00") : undefined,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: mounted ? safeProgress / 100 : 0 }}
          transition={{
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1],
            delay: delay
          }}
        />
      </div>
    </div>
  );
}
