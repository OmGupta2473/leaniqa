import { Variants, Transition } from "motion/react";

// --- Transitions ---
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeSpring = [0.34, 1.56, 0.64, 1] as const;
export const easeSnappy = [0.4, 0, 0.2, 1] as const;

export const baseTransition: Transition = {
  duration: 0.6,
  ease: easeOut,
};

export const springTransition: Transition = {
  duration: 0.8,
  ease: easeSpring,
};

// --- Container Variants ---
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// --- Item Variants ---
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: baseTransition 
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: baseTransition 
  },
};

export const slideUpSpring: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: springTransition 
  },
};

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: baseTransition 
  },
};

export const blurReveal: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)", y: 20 },
  visible: { 
    opacity: 1, 
    filter: "blur(0px)", 
    y: 0, 
    transition: { duration: 0.8, ease: easeOut } 
  },
};

// --- Continuous Animations ---
export const floatingAnimation = (delay = 0, duration = 4): Variants => ({
  animate: {
    y: ["0%", "-4%", "0%"],
    rotate: [0, 1, -1, 0],
    transition: {
      duration,
      ease: "easeInOut",
      repeat: Infinity,
      delay,
    },
  },
});

export const pulseGlow: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [0.95, 1.05, 0.95],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// --- Interaction Variants ---
export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { 
    y: -4, 
    scale: 1.02, 
    transition: { duration: 0.2, ease: easeSnappy } 
  },
  tap: { 
    y: 0, 
    scale: 0.98, 
    transition: { duration: 0.1, ease: easeSnappy } 
  },
};
