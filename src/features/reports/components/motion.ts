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
