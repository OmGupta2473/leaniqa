import sys

with open('src/components/WheelPicker.tsx', 'r') as f:
    content = f.read()

# Replace the internal physics logic with the new useWheelPhysics hook
# The hook is now exported from useWheelPhysics.ts

new_imports = """import React, { useEffect, useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { cn } from '@/shared/utils/utils';
import { useWheelPhysics } from './useWheelPhysics';"""

content = content.replace("import React, { useEffect, useRef, useState } from 'react';\nimport { motion, useMotionValue, useTransform, animate, PanInfo } from 'motion/react';\nimport { cn } from '@/shared/utils/utils';\nimport { haptics } from '@/shared/utils/haptics';", new_imports)

# Now rewrite WheelPicker

wheel_picker_start = """export function WheelPicker({
  items,
  value,
  onChange,
  itemHeight = 60,
  visibleItems = 5,
  unit,
  className
}: WheelPickerProps) {"""

# Replace everything from WheelPicker function body up to the return statement.
wheel_picker_logic = """  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    y, 
    springY, 
    handlePanStart, 
    handlePan, 
    handlePanEnd, 
    snapToNearest,
    isInteracting
  } = useWheelPhysics({
    itemsLength: items.length,
    itemHeight,
    value,
    items,
    onChange
  });

  const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wheel handling for desktop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Stop main page scrolling
      isInteracting.current = true;
      
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
      springY.jump(nextY);
      
      // Debounce snapping until scrolling stops
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => {
         snapToNearest(y.get());
         setTimeout(() => { isInteracting.current = false; }, 100);
      }, 100);
    };

    // Passive MUST be false to allow preventDefault
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
    };
  }, [items, itemHeight, y, springY, snapToNearest, isInteracting]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      isInteracting.current = true;
      
      let currentIndex = Math.round(-y.get() / itemHeight);
      if (e.key === 'ArrowUp') currentIndex--;
      else if (e.key === 'ArrowDown') currentIndex++;
      else if (e.key === 'PageUp') currentIndex -= 5;
      else if (e.key === 'PageDown') currentIndex += 5;
      else if (e.key === 'Home') currentIndex = 0;
      else if (e.key === 'End') currentIndex = items.length - 1;
      
      currentIndex = Math.max(0, Math.min(items.length - 1, currentIndex));
      
      snapToNearest(-currentIndex * itemHeight);
      setTimeout(() => { isInteracting.current = false; }, 100);
    }
  };"""

# We need to find the start of the WheelPicker function and replace the body.
import re

start_index = content.find(wheel_picker_start) + len(wheel_picker_start)
end_index = content.find("  return (", start_index)

content = content[:start_index] + "\n" + wheel_picker_logic + "\n" + content[end_index:]

# Also replace drag props with pan props
content = content.replace("""      <motion.div
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
      >""", """      <motion.div
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{ y: springY }}
        className="absolute w-full top-1/2 touch-none"
      >""")

# Replace the y prop in WheelItem with springY
content = content.replace("y={y}", "springY={springY}")
content = content.replace("function WheelItem({ item, index, y, itemHeight }: { item: any, index: number, y: any, itemHeight: number }) {", "function WheelItem({ item, index, springY, itemHeight }: { item: any, index: number, springY: any, itemHeight: number }) {")
content = content.replace("const distance = useTransform(y, (currentY) => {", "const distance = useTransform(springY, (currentY) => {")


with open('src/components/WheelPicker.tsx', 'w') as f:
    f.write(content)
