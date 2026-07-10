import { HTMLAttributes, ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/shared/utils/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: "default" | "high-contrast" | "subtle";
  glowColor?: "lime" | "coral" | "blue" | "none";
  interactive?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = "default",
  glowColor = "none",
  interactive = false,
  ...props
}: GlassCardProps) {
  
  const baseClasses = "relative overflow-hidden rounded-[var(--r-xl)] border border-[var(--border)] backdrop-blur-[20px] z-10";
  
  const variants = {
    "default": "bg-[rgba(17,17,19,0.8)]",
    "high-contrast": "bg-[rgba(24,24,27,0.9)] border-[var(--border-2)]",
    "subtle": "bg-[rgba(17,17,19,0.4)] backdrop-blur-[10px]",
  };

  const glows = {
    lime: "after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_top,rgba(212,255,0,0.1),transparent_70%)] after:z-[-1]",
    coral: "after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_top,rgba(255,77,28,0.1),transparent_70%)] after:z-[-1]",
    blue: "after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_top,rgba(55,138,221,0.1),transparent_70%)] after:z-[-1]",
    none: "",
  };

  const interactiveClasses = interactive
    ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[rgba(255,255,255,0.15)]"
    : "";

  return (
    <motion.div
      className={cn(baseClasses, variants[variant], glows[glowColor], interactiveClasses, className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
