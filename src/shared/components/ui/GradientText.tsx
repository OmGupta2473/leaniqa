import { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  variant?: "lime" | "coral" | "blue" | "silver";
  animate?: boolean;
}

export function GradientText({
  children,
  className,
  variant = "lime",
  animate = false,
}: GradientTextProps) {
  const baseClasses = "bg-clip-text text-transparent [-webkit-text-fill-color:transparent] [-webkit-background-clip:text]";
  
  const variants = {
    lime: "bg-gradient-to-br from-[var(--lime)] via-[#AFDB00] to-[var(--lime)]",
    coral: "bg-gradient-to-br from-[var(--coral)] via-[#FF7A55] to-[var(--coral)]",
    blue: "bg-gradient-to-br from-[var(--blue)] via-[#5CA3E8] to-[var(--blue)]",
    silver: "bg-gradient-to-br from-[var(--text-3)] via-[var(--text)] to-[var(--text-3)]",
  };

  const animationClasses = animate ? "bg-[length:200%_auto] animate-[lp-shine_4s_linear_infinite]" : "";

  return (
    <span className={cn(baseClasses, variants[variant], animationClasses, className)}>
      {children}
    </span>
  );
}
