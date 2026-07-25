import re

with open('src/features/dashboard/pages/DashboardPage.tsx', 'r') as f:
    content = f.read()

# Add `memo` to imports
if 'import { useEffect, useState, useRef, memo } from "react";' not in content:
    content = content.replace(
        'import { useEffect, useState, useRef } from "react";',
        'import { useEffect, useState, useRef, memo } from "react";'
    )

old_comp = """function AnimatedNumber({
  value,
  duration = 800,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start: number | null = null;
    let animationFrameId: number;

    const update = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutExpo
      setDisplayValue(Math.round(ease * value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span ref={elementRef}>{displayValue}</span>;
}"""

new_comp = """const AnimatedNumber = memo(function AnimatedNumber({
  value,
  duration = 800,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
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
        const nextValue = Math.round(ease * value);
        
        setDisplayValue(prev => (prev !== nextValue ? nextValue : prev));
      }

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    const startAnimation = () => {
      start = null;
      lastUpdate = 0;
      animationFrameId = requestAnimationFrame(update);
    };

    if (elementRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            startAnimation();
            observer.disconnect(); // only animate once when it becomes visible
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(elementRef.current);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
    };
  }, [value, duration]);

  return <span ref={elementRef}>{displayValue}</span>;
});"""

content = content.replace(old_comp, new_comp)

with open('src/features/dashboard/pages/DashboardPage.tsx', 'w') as f:
    f.write(content)
