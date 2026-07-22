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
  const [isDragging, setIsDragging] = useState(false);
  const selectedIndex = Math.max(0, items.indexOf(value as never));
  
  // Set initial position
  useEffect(() => {
    if (!isDragging) {
      const targetY = -selectedIndex * itemHeight;
      animate(y, targetY, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }, [value, selectedIndex, itemHeight, isDragging, y]);

  const handleDragEnd = (e: any, info: PanInfo) => {
    setIsDragging(false);
    
    // Calculate current projected position based on velocity
    const velocity = info.velocity.y;
    const currentY = y.get();
    
    // Simple projection (distance = velocity * constant)
    const projectedY = currentY + velocity * 0.15;
    
    // Calculate nearest index
    let targetIndex = Math.round(-projectedY / itemHeight);
    
    // Bound the index
    targetIndex = Math.max(0, Math.min(items.length - 1, targetIndex));
    
    const targetY = -targetIndex * itemHeight;
    
    animate(y, targetY, { 
      type: 'spring', 
      stiffness: 250, 
      damping: 30, 
      velocity,
      onComplete: () => {
        const newValue = items[targetIndex];
        if (newValue !== value) {
          onChange(newValue);
          haptics.tap();
        }
      }
    });
    
    // Optimistically update
    const newValue = items[targetIndex];
    if (newValue !== value) {
      onChange(newValue);
      haptics.tap();
    }
  };

  return (
    <div 
      className={cn("relative overflow-hidden cursor-grab active:cursor-grabbing", className)} 
      style={{ height: itemHeight * visibleItems, width: '100%', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)' }}
      ref={containerRef}
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
        onDragStart={() => setIsDragging(true)}
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

  const scale = useTransform(absDistance, [0, itemHeight * 2.5], [1.1, 0.7]);
  const opacity = useTransform(absDistance, [0, itemHeight, itemHeight * 2.5], [1, 0.3, 0]);
  const rotateX = useTransform(distance, [-itemHeight * 2, 0, itemHeight * 2], [-45, 0, 45]);
  const blurRaw = useTransform(absDistance, [0, itemHeight * 1.5, itemHeight * 3], [0, 2, 8]);
  const filter = useTransform(blurRaw, (b) => `blur(${b}px)`);
  
  // We can't interpolate colors easily across all devices without framer-motion full color support,
  // so we'll rely on opacity and a slightly brighter base color
  
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
