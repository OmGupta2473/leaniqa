import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface SectionRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function SectionReveal({ children, delay = 0, className }: SectionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}