import { useEffect, useRef } from 'react';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';

/**
 * Horizontal drag/scale picker used in onboarding and the profile editor.
 *
 * Ticks are generated from min..max at `step` intervals. Scrolling snaps to
 * the nearest tick and calls `onChange(newValue)` once per snap. The centre
 * lime line marks the current value. `formatLabel` is the big number;
 * `formatSubLabel` is the small line underneath (e.g. cm → ft/in).
 */
export interface ScalePickerProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  formatLabel: (val: number) => string;
  formatSubLabel?: (val: number) => string;
}

export function ScalePicker({ value, min, max, step, onChange, formatLabel, formatSubLabel }: ScalePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const ticks = [];
  for (let i = min; i <= max; i += step) {
    ticks.push(i);
  }

  // Sync scroll position when value changes from outside
  useEffect(() => {
    if (!containerRef.current || isDragging.current) return;
    const timer = setTimeout(() => {
      const index = Math.round((value - min) / step);
      const container = containerRef.current;
      if (!container) return;
      const item = container.children[index] as HTMLElement;
      if (item) {
        const scrollPos = item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2;
        container.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [value, min, step]);

  // Calculate nearest value on scroll
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const centerX = container.scrollLeft + container.offsetWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(centerX - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    const newValue = min + closestIndex * step;
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  // Debounce scroll end to trigger haptics
  const scrollTimeout = useRef<number | null>(null);
  const onScroll = () => {
    isDragging.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
      isDragging.current = false;
      haptics.tap();
    }, 150);
    handleScroll();
  };

  return (
    <div className="relative w-full h-32 bg-[#141416] rounded-[20px] border border-[#2A2A2C] overflow-hidden select-none">
      {/* Center indicator */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#D4FF00] z-20 pointer-events-none -translate-x-1/2" />

      {/* Side gradients to fade out ticks */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#141416] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#141416] to-transparent z-10 pointer-events-none" />

      {/* Active Value Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none">
        <div className="text-[24px] font-bold text-white leading-none tracking-tight tabular-nums">
          {formatLabel(value)}
        </div>
        {formatSubLabel && (
          <div className="text-[12px] text-zinc-400 mt-1 font-medium">{formatSubLabel(value)}</div>
        )}
      </div>

      {/* Scrollable Ticks */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory pt-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          scrollPaddingLeft: 'calc(50% - 16px)',
          scrollPaddingRight: 'calc(50% - 16px)',
          paddingLeft: 'calc(50% - 16px)',
          paddingRight: 'calc(50% - 16px)',
        }}
      >
        {ticks.map((tick) => {
          const isMajor = tick % 10 === 0;
          return (
            <div
              key={tick}
              className="w-8 flex flex-col items-center justify-end shrink-0 snap-center pb-2"
            >
              <div className={cn(
                "w-[2px] rounded-full transition-colors",
                isMajor ? "h-5 bg-[#5A5A5C]" : "h-3 bg-[#3A3A3C]"
              )} />
              {isMajor && (
                <span className="text-[10px] text-zinc-500 mt-1 tabular-nums font-medium">
                  {tick}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}