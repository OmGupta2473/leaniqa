import { motion } from "motion/react";
import { cn } from "@/shared/utils/utils";

interface AnimatedDividerProps {
  className?: string;
}

export function AnimatedDivider({ className }: AnimatedDividerProps) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "h-[1px] w-full max-w-[800px] mx-auto bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent origin-center",
        className
      )}
      aria-hidden="true"
    />
  );
}
