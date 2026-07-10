import { cn } from "@/shared/utils/utils";

interface AmbientGlowProps {
  color?: "lime" | "blue" | "coral" | "purple";
  size?: "sm" | "md" | "lg" | "xl";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  className?: string;
  delay?: string;
}

export function AmbientGlow({
  color = "lime",
  size = "lg",
  position = "center",
  className,
  delay = "0s",
}: AmbientGlowProps) {
  
  const colors = {
    lime: "rgba(212,255,0,0.06)",
    blue: "rgba(55,138,221,0.06)",
    coral: "rgba(255,77,28,0.05)",
    purple: "rgba(191,90,242,0.05)",
  };

  const sizes = {
    sm: "w-[200px] h-[200px]",
    md: "w-[400px] h-[400px]",
    lg: "w-[600px] h-[600px]",
    xl: "w-[800px] h-[800px]",
  };

  const positions = {
    "top-left": "-top-[20%] -left-[10%]",
    "top-right": "-top-[20%] -right-[10%]",
    "bottom-left": "-bottom-[20%] -left-[10%]",
    "bottom-right": "-bottom-[20%] -right-[10%]",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <div 
      className={cn(
        "absolute rounded-full pointer-events-none blur-[100px] animate-[lp-float-slow_8s_ease-in-out_infinite]",
        sizes[size],
        positions[position],
        className
      )}
      style={{
        background: `radial-gradient(circle, ${colors[color]} 0%, transparent 70%)`,
        animationDelay: delay,
      }}
      aria-hidden="true"
    />
  );
}
