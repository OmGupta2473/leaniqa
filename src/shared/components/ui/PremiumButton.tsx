import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { hoverLift } from "@/shared/motion/variants";
import { cn } from "@/shared/utils/utils";

interface PremiumButtonProps extends Omit<HTMLMotionProps<"button">, "variant"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function PremiumButton({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: PremiumButtonProps) {
  
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-[var(--r-pill)] font-bold tracking-tight whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] focus-visible:ring-[var(--lime)] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[var(--lime)] text-[#06060A] shadow-[0_4px_24px_rgba(212,255,0,0.3)] hover:shadow-[0_8px_32px_rgba(212,255,0,0.4)]",
    secondary: "bg-[rgba(255,255,255,0.06)] text-[var(--text)] border border-[var(--border-2)] hover:bg-[rgba(255,255,255,0.10)] hover:border-[rgba(255,255,255,0.2)]",
    ghost: "bg-transparent text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.05)]",
  };

  const sizes = {
    sm: "px-4 py-2 text-[13px]",
    md: "px-6 py-3 text-[15px]",
    lg: "px-8 py-4 text-[17px]",
  };

  return (
    <motion.button
      variants={hoverLift}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
