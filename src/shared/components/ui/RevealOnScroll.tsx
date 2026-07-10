import { ReactNode } from "react";
import { motion } from "motion/react";
import { fadeIn, slideUp, slideUpSpring, scaleReveal, blurReveal } from "@/shared/motion/variants";
import { cn } from "@/shared/utils/utils";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  variant?: "fade" | "slideUp" | "slideUpSpring" | "scale" | "blur";
  delay?: number;
  once?: boolean;
}

export function RevealOnScroll({
  children,
  className,
  variant = "slideUp",
  delay = 0,
  once = true,
}: RevealOnScrollProps) {
  const variantMap = {
    fade: fadeIn,
    slideUp: slideUp,
    slideUpSpring: slideUpSpring,
    scale: scaleReveal,
    blur: blurReveal,
  };

  const selectedVariant = variantMap[variant];

  // Apply delay to the transition if provided
  const customVariant = delay > 0 ? {
    ...selectedVariant,
    visible: {
      ...(selectedVariant.visible as any),
      transition: {
        ...(selectedVariant.visible as any).transition,
        delay,
      }
    }
  } : selectedVariant;

  return (
    <motion.div
      variants={customVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10%" }}
      className={cn("will-change-[opacity,transform,filter]", className)}
    >
      {children}
    </motion.div>
  );
}
