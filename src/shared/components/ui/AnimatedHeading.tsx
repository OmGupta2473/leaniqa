import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { slideUp, staggerContainer } from "@/shared/motion/variants";
import { cn } from "@/shared/utils/utils";

interface AnimatedHeadingProps extends Omit<HTMLMotionProps<"h1">, "children"> {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  stagger?: boolean;
}

export function AnimatedHeading({
  children,
  as: Component = "h2",
  className,
  stagger = false,
  ...props
}: AnimatedHeadingProps) {
  
  const baseClasses = "font-extrabold tracking-[-0.04em] leading-[1.05] text-[var(--text)]";
  
  const tags = {
    h1: "text-[var(--font-hero)]",
    h2: "text-[var(--font-4xl)]",
    h3: "text-[var(--font-3xl)]",
  };

  const MotionComponent = motion[Component] as any;

  if (stagger && typeof children === "string") {
    const lines = children.split("\n");
    return (
      <MotionComponent
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className={cn(baseClasses, tags[Component], className)}
        {...props}
      >
        {lines.map((line, i) => (
          <div key={i} className="overflow-hidden">
            <motion.div variants={slideUp}>{line}</motion.div>
          </div>
        ))}
      </MotionComponent>
    );
  }

  return (
    <div className="overflow-hidden">
      <MotionComponent
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className={cn(baseClasses, tags[Component], className)}
        {...props}
      >
        {children}
      </MotionComponent>
    </div>
  );
}
