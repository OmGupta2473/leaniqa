import { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/shared/utils/utils";

interface PremiumBadgeProps {
  icon: ReactNode;
  label: string;
  color?: "lime" | "coral" | "blue" | "silver" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
  earned?: boolean;
}

export function PremiumBadge({
  icon,
  label,
  color = "lime",
  size = "md",
  className,
  earned = true,
}: PremiumBadgeProps) {

  const sizes = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-24 h-24 text-4xl",
  };

  const colors = {
    lime: { border: "rgba(212,255,0,0.5)", bg: "rgba(212,255,0,0.1)", text: "var(--lime)" },
    coral: { border: "rgba(255,77,28,0.5)", bg: "rgba(255,77,28,0.1)", text: "var(--coral)" },
    blue: { border: "rgba(55,138,221,0.5)", bg: "rgba(55,138,221,0.1)", text: "var(--blue)" },
    gold: { border: "rgba(255,214,10,0.5)", bg: "rgba(255,214,10,0.1)", text: "var(--gold)" },
    silver: { border: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)", text: "var(--text)" },
  };

  const selectedColor = colors[color];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        whileHover={earned ? { scale: 1.1, rotateY: 15, rotateX: 15 } : {}}
        style={{ perspective: 1000 }}
        className="cursor-pointer"
      >
        <div 
          className={cn(
            "relative flex items-center justify-center hexagon-shape transition-all duration-500",
            sizes[size],
            !earned && "opacity-30 grayscale saturate-0"
          )}
          style={{
            background: selectedColor.bg,
            border: `1px solid ${selectedColor.border}`,
            boxShadow: earned ? `0 0 20px ${selectedColor.bg}, inset 0 0 20px ${selectedColor.bg}` : "none",
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          }}
        >
          {icon}
        </div>
      </motion.div>
      <div 
        className="text-[11px] font-bold tracking-wide uppercase text-center max-w-[80px]"
        style={{ color: earned ? selectedColor.text : "var(--text-3)" }}
      >
        {label}
      </div>
    </div>
  );
}
