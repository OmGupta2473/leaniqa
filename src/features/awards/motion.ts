export const SPRING = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  gentle: { type: 'spring', stiffness: 200, damping: 25 },
  bouncy: { type: 'spring', stiffness: 500, damping: 18 },
} as const;

export type SpringToken = keyof typeof SPRING;