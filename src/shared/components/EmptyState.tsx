import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaText,
  onCtaClick,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] backdrop-blur-md", className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mb-5"
      >
        <Icon size={28} className="text-[rgba(255,255,255,0.5)]" />
      </motion.div>
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-[18px] font-bold text-white mb-2 tracking-tight"
      >
        {title}
      </motion.h3>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-[14px] text-[rgba(255,255,255,0.5)] max-w-[280px] mb-6 leading-relaxed"
      >
        {description}
      </motion.p>
      {ctaText && onCtaClick && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 0.3 }}
          onClick={onCtaClick}
          className="px-6 py-3 rounded-full bg-[#D4FF00] text-black font-bold text-[14px] shadow-[0_0_20px_rgba(212,255,0,0.2)] tracking-wide"
        >
          {ctaText}
        </motion.button>
      )}
    </div>
  );
}
