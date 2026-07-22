import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'motion/react';
import { cn } from '@/shared/utils/utils';
import { haptics } from '@/shared/utils/haptics';

export interface WheelPickerProps {
  items: (number | string)[];
  value: number | string;
  onChange: (value: any) => void;
  itemHeight?: number;
  visibleItems?: number;
  unit?: string;
  className?: string;
}

export function WheelPicker({
  items,
  value,
  onChange,
  itemHeight = 60,
  visibleItems = 5,
  unit,
  className
}: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const isInteracting = useRef(false);
  const wheelTimeout = useRef<ReturnType<typeof setTimeout>>();
  const selectedIndex = Math.max(0, items.indexOf(value as never));

  // Sync external value changes to motion value, unless actively interacting
  useEffect(() => {
    if (!isInteracting.current) {
      const targetY = -selectedIndex * itemHeight;
      animate(y, targetY, { type: 'spring', stiffness: 400, damping: 40 });
    }
  }, [selectedIndex, itemHeight, y]);

  // Haptics on crossing boundaries
  useEffect(() => {
    let lastIndex = selectedIndex;
    const unsubscribe = y.on('change', (val) => {
      const currentIndex = Math.max(0, Math.min(items.length - 1, Math.round(-val / itemHeight)));
      if (currentIndex !== lastIndex) {
        lastIndex = currentIndex;
        haptics.tap();
      }
    });
    return unsubscribe;
  }, [y, itemHeight, items.length, selectedIndex]);

  const handleDragStart = () => {
    isInteracting.current = true;
    y.stop();
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const currentY = y.get();
    
    // Project velocity forward to simulate natural decay
    const power = 0.4; 
    const projectedY = currentY + velocity * power;
    
    let targetIndex = Math.round(-projectedY / itemHeight);
    targetIndex = Math.max(0, Math.min(items.length - 1, targetIndex));
    
    const targetY = -targetIndex * itemHeight;
    
    // Optimistically update to enable "Continue" buttons instantly
    onChange(items[targetIndex]);
    
    animate(y, targetY, { 
      type: 'spring', 
      stiffness: 250, 
      damping: 30, 
      velocity,
      onComplete: () => {
        isInteracting.current = false;
      }
    });
  };

  // Wheel handling for desktop (mouse wheel & trackpad)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Stop main page scrolling
      isInteracting.current = true;
      y.stop();
      
      const currentY = y.get();
      // Delta mapping for trackpads vs mice
      let nextY = currentY - e.deltaY * 0.6; 
      
      const minY = -(items.length - 1) * itemHeight;
      const maxY = 0;
      
      // Rubber band effect at boundaries
      if (nextY > maxY) {
         nextY = maxY + (nextY - maxY) * 0.1; 
      } else if (nextY < minY) {
         nextY = minY + (nextY - minY) * 0.1;
      }
      
      y.set(nextY);
      
      // Debounce snapping until scrolling stops
      clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => {
         let targetIndex = Math.round(-y.get() / itemHeight);
         targetIndex = Math.max(0, Math.min(items.length - 1, targetIndex));
         const targetY = -targetIndex * itemHeight;
         
         onChange(items[targetIndex]);
         
         animate(y, targetY, { 
             type: 'spring', stiffness: 400, damping: 40,
             onComplete: () => {
                 isInteracting.current = false;
             }
         });
      }, 100);
    };

    // Passive MUST be false to allow preventDefault
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout.current);
    };
  }, [items, itemHeight, y, onChange]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      isInteracting.current = true;
      y.stop();
      
      let currentIndex = Math.round(-y.get() / itemHeight);
      if (e.key === 'ArrowUp') currentIndex--;
      else if (e.key === 'ArrowDown') currentIndex++;
      else if (e.key === 'PageUp') currentIndex -= 5;
      else if (e.key === 'PageDown') currentIndex += 5;
      else if (e.key === 'Home') currentIndex = 0;
      else if (e.key === 'End') currentIndex = items.length - 1;
      
      currentIndex = Math.max(0, Math.min(items.length - 1, currentIndex));
      const targetY = -currentIndex * itemHeight;
      
      onChange(items[currentIndex]);
      
      animate(y, targetY, {
         type: 'spring', stiffness: 400, damping: 40,
         onComplete: () => { isInteracting.current = false; }
      });
    }
  };

  return (
    <div 
      className={cn("relative overflow-hidden cursor-grab active:cursor-grabbing outline-none select-none", className)} 
      style={{ 
        height: itemHeight * visibleItems, 
        width: '100%', 
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)', 
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
        touchAction: 'none' // CRITICAL: prevents mobile page scrolling when dragging the wheel
      }}
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-valuenow={typeof value === 'number' ? value : undefined}
      aria-valuetext={String(value)}
    >
      {/* Center highlight overlay */}
      <div 
        className="absolute w-full top-1/2 -translate-y-1/2 pointer-events-none rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-[inset_0_0_12px_rgba(255,255,255,0.02)]"
        style={{ height: itemHeight + 8 }}
      />
      
      <div 
        className="absolute top-1/2 left-0 w-full pointer-events-none -translate-y-1/2 flex items-center justify-center h-0 z-10"
      >
         {unit && <span className="absolute right-4 md:right-8 text-zinc-500 font-medium text-xl">{unit}</span>}
      </div>

      <motion.div
        drag="y"
        dragConstraints={{
          top: -(items.length - 1) * itemHeight,
          bottom: 0
        }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="absolute w-full top-1/2"
      >
        {items.map((item, i) => (
          <WheelItem 
            key={item} 
            item={item} 
            index={i} 
            y={y} 
            itemHeight={itemHeight} 
          />
        ))}
      </motion.div>
    </div>
  );
}

function WheelItem({ item, index, y, itemHeight }: { item: any, index: number, y: any, itemHeight: number }) {
  const itemPosition = index * itemHeight;
  
  // y ranges from 0 (first item selected) to -(length-1)*itemHeight (last item selected)
  const distance = useTransform(y, (currentY) => {
    return (currentY as number) + itemPosition;
  });

  // Calculate abs distance for scale/opacity
  const absDistance = useTransform(distance, (d) => Math.abs(d as number));

  const scale = useTransform(absDistance, [0, itemHeight * 2.5], [1.08, 0.7]);
  const opacity = useTransform(absDistance, [0, itemHeight, itemHeight * 2.5], [1, 0.3, 0]);
  const rotateX = useTransform(distance, [-itemHeight * 2, 0, itemHeight * 2], [-45, 0, 45]);
  
  const blurRaw = useTransform(absDistance, [0, itemHeight * 1.5, itemHeight * 3], [0, 2, 8]);
  const filter = useTransform(blurRaw, (b) => `blur(${b}px)`);
  
  return (
    <motion.div
      className="absolute w-full flex items-center justify-center font-semibold text-4xl sm:text-5xl text-white pointer-events-none"
      style={{
        height: itemHeight,
        top: -itemHeight / 2 + itemPosition,
        scale,
        opacity,
        rotateX,
        filter,
        transformPerspective: 500,
        transformStyle: 'preserve-3d'
      }}
    >
      {item}
    </motion.div>
  );
}
