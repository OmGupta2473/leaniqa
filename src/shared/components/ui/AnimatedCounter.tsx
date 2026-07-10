import { useEffect, useState, useRef, memo } from "react";
import { useInView } from "motion/react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: "number" | "currency" | "percent" | "compact";
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  duration = 1000,
  format = "number",
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!isInView) return;

    let animationFrameId: number;
    let start: number | null = null;
    let lastUpdate = 0;

    const update = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      
      // Throttle frames to ~30fps to reduce React render overhead
      if (time - lastUpdate > 32 || elapsed >= duration) {
        lastUpdate = time;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // easeOutExpo
        const nextValue = ease * value;
        
        setDisplayValue(nextValue);
      }

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, isInView]);

  const formattedValue = () => {
    let num = displayValue;
    if (decimals > 0) {
      num = Number(num.toFixed(decimals));
    } else {
      num = Math.round(num);
    }

    let str = num.toString();

    if (format === "compact") {
      if (num >= 1000000) {
        str = (num / 1000000).toFixed(1) + "M";
      } else if (num >= 1000) {
        str = (num / 1000).toFixed(decimals) + "K";
      }
    } else if (format === "number") {
      str = num.toLocaleString();
    }

    // Strip trailing .0 if present in compact formatting
    if (str.endsWith(".0K")) str = str.replace(".0K", "K");
    if (str.endsWith(".0M")) str = str.replace(".0M", "M");

    return `${prefix}${str}${suffix}`;
  };

  return <span ref={elementRef} className="tabular-nums">{formattedValue()}</span>;
});
