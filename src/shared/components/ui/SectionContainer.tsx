import { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
  padding?: "default" | "hero" | "none";
}

export function SectionContainer({
  children,
  className,
  id,
  padding = "default",
}: SectionContainerProps) {
  
  const baseClasses = "relative z-10 w-full";
  
  const paddings = {
    none: "",
    default: "py-20 md:py-28 lg:py-32 px-5 md:px-10 lg:px-16",
    hero: "pt-32 md:pt-40 lg:pt-48 pb-20 md:pb-28 lg:pb-32 px-5 md:px-10 lg:px-16 min-h-[100dvh] flex items-center",
  };

  return (
    <section id={id} className={cn(baseClasses, paddings[padding], className)}>
      <div className="mx-auto w-full max-w-[1120px]">
        {children}
      </div>
    </section>
  );
}
