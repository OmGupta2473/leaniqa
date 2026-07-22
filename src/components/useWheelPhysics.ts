import { useRef, useEffect, useCallback } from 'react';
import { useSpring, useMotionValue, PanInfo } from 'motion/react';
import { haptics } from '@/shared/utils/haptics';

export function useWheelPhysics({
  itemsLength,
  itemHeight,
  value,
  items,
  onChange
}: {
  itemsLength: number;
  itemHeight: number;
  value: number | string;
  items: (number | string)[];
  onChange: (value: any) => void;
}) {
  const selectedIndex = Math.max(0, items.indexOf(value as never));
  const isInteracting = useRef(false);
  
  // y tracks the precise touch position
  const y = useMotionValue(-selectedIndex * itemHeight);
  
  // springY is the actual visual value, jumping during drag, springing otherwise
  const springY = useSpring(-selectedIndex * itemHeight, { stiffness: 400, damping: 40, mass: 1 });

  // Sync external value changes
  useEffect(() => {
    if (!isInteracting.current) {
      y.set(-selectedIndex * itemHeight);
      springY.set(-selectedIndex * itemHeight);
    }
  }, [selectedIndex, itemHeight, y, springY]);

  // Haptics
  useEffect(() => {
    let lastIndex = selectedIndex;
    const unsubscribe = springY.on('change', (val) => {
      const currentIndex = Math.max(0, Math.min(itemsLength - 1, Math.round(-val / itemHeight)));
      if (currentIndex !== lastIndex) {
        lastIndex = currentIndex;
        haptics.tap();
      }
    });
    return unsubscribe;
  }, [springY, itemHeight, itemsLength, selectedIndex]);

  const snapToNearest = useCallback((targetYValue: number) => {
    let targetIndex = Math.round(-targetYValue / itemHeight);
    targetIndex = Math.max(0, Math.min(itemsLength - 1, targetIndex));
    
    onChange(items[targetIndex]);
    y.set(-targetIndex * itemHeight);
    springY.set(-targetIndex * itemHeight);
  }, [itemHeight, itemsLength, items, onChange, y, springY]);

  const handlePanStart = () => {
    isInteracting.current = true;
    springY.stop();
  };

  const handlePan = (e: any, info: PanInfo) => {
    const nextY = y.get() + info.delta.y;
    y.set(nextY);
    springY.jump(nextY); // 1:1 instantaneous tracking
  };

  const handlePanEnd = (e: any, info: PanInfo) => {
    isInteracting.current = false;
    const velocity = info.velocity.y;
    const currentY = y.get();
    
    // Exponential decay projection
    const projectedY = currentY + velocity * 0.4;
    snapToNearest(projectedY);
  };

  return { y, springY, handlePanStart, handlePan, handlePanEnd, snapToNearest, isInteracting };
}
