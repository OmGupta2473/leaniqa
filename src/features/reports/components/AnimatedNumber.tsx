import { motion, useSpring, useTransform, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { springSettle } from "./motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedNumber({ value, className, style }: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const animatedValue = useSpring(reducedMotion ? value : 0, springSettle);
  const displayValue = useTransform(animatedValue, (v) => Math.round(v));

  useEffect(() => {
    animatedValue.set(value);
  }, [value, animatedValue]);

  return (
    <motion.span className={className} style={style}>
      {reducedMotion ? value : displayValue}
    </motion.span>
  );
}
