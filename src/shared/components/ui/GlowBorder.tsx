import { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

interface GlowBorderProps {
  children: ReactNode;
  className?: string;
  color?: "lime" | "coral" | "blue";
  active?: boolean;
}

export function GlowBorder({
  children,
  className,
  color = "lime",
  active = true,
}: GlowBorderProps) {
  
  const colors = {
    lime: "rgba(212,255,0,0.35)",
    coral: "rgba(255,77,28,0.35)",
    blue: "rgba(55,138,221,0.35)",
  };

  const glows = {
    lime: "0 0 0 1px rgba(212,255,0,0.1), var(--lime-glow)",
    coral: "0 0 0 1px rgba(255,77,28,0.1), 0 0 40px rgba(255,77,28,0.25)",
    blue: "0 0 0 1px rgba(55,138,221,0.1), 0 0 40px rgba(55,138,221,0.25)",
  };

  const borderStyle = active ? {
    border: `1px solid ${colors[color]}`,
    boxShadow: glows[color],
  } : {};

  return (
    <div 
      className={cn("relative rounded-[var(--r-xl)] transition-all duration-500", className)}
      style={borderStyle}
    >
      {children}
    </div>
  );
}
