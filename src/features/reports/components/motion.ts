// LeanIQa — Framer Motion Presets
// Apple-quality timing and easing — import these in every screen

import { Variants, Transition } from "motion/react";

/* ── Easing ── */
export const ease = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
} as const;

/* ── Transitions ── */
export const transition = {
  fast: { duration: 0.15, ease: ease.smooth } as Transition,
  base: { duration: 0.25, ease: ease.smooth } as Transition,
  page: { duration: 0.5, ease: ease.outExpo } as Transition,
  spring: { type: "spring", stiffness: 120, damping: 20, mass: 0.8 } as Transition,
  springFast: { type: "spring", stiffness: 300, damping: 30, mass: 0.6 } as Transition,
  reveal: { duration: 0.6, ease: ease.outExpo } as Transition,
  stagger: (i: number) => ({ duration: 0.5, delay: i * 0.06, ease: ease.outExpo }) as Transition,
};

/* ── Page variants ── */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: ease.outExpo, staggerChildren: 0.07 }
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: ease.smooth } }
};

/* ── Item variants (children in a stagger container) ── */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: ease.outExpo } }
};

/* ── Card variants ── */
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: ease.outExpo }
  }
};

/* ── Fade variants ── */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: ease.smooth } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: ease.smooth } }
};

/* ── Scale variants (for modals, sheets) ── */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.3, ease: ease.outExpo }
  },
  exit: {
    opacity: 0, scale: 0.95,
    transition: { duration: 0.2, ease: ease.smooth }
  }
};

/* ── Slide up (bottom sheets) ── */
export const slideUpVariants: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: 0, opacity: 1,
    transition: { type: "spring", stiffness: 320, damping: 32, mass: 0.9 }
  },
  exit: {
    y: "100%", opacity: 0,
    transition: { duration: 0.28, ease: ease.in }
  }
};

/* ── Hover presets (for whileHover prop) ── */
export const hover = {
  lift: { y: -3, transition: { duration: 0.2, ease: ease.smooth } },
  scale: { scale: 1.03, transition: { duration: 0.2, ease: ease.smooth } },
  glow: {
    scale: 1.03,
    boxShadow: "0 0 32px rgba(212,255,0,0.35)",
    transition: { duration: 0.2, ease: ease.smooth }
  },
  subtle: { backgroundColor: "rgba(255,255,255,0.06)" }
};

/* ── Tap preset ── */
export const tap = {
  scale: { scale: 0.96, transition: { duration: 0.1 } }
};

/* ── Number counter (for AnimatedNumber) ── */
export const springConfig = {
  stiffness: 80,
  damping: 20,
  mass: 0.8
};

/* ── Legacy presets (for backwards compatibility) ── */
export const springSettle = {
  type: "spring" as const,
  stiffness: 120,
  damping: 14,
  mass: 1,
};

export const springTap = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

export const transitionStagger = 0.05;

export const transitionFadeSlide = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};
